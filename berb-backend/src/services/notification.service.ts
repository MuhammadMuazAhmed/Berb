import "server-only";
import { Notification, Service, TeamMember } from "@/models";
import { getEnv } from "@/lib/env";
import { emailProvider } from "@/lib/email/provider";
import { jobEmail, type JobEmailData } from "@/lib/email/templates";
import { notFound, unprocessable } from "@/lib/errors";

type Type = "job_assigned" | "job_rescheduled" | "job_cancelled";
const MAX_ATTEMPTS = 6;
const backoffMs = (attempt: number) => Math.min(2 ** attempt * 60_000, 6 * 3600_000); // 2m, 4m, 8m ... capped at 6h

/**
 * Outbox write. Called AFTER the assignment has been saved; a failure here never rolls the assignment back
 * (we log and swallow). dedupeKey makes repeated calls for the same intended delivery a no-op.
 */
export async function queueNotification(a: { request: { _id: unknown; reference: string }; memberId: string; type: Type; version: number; note?: string }) {
  try {
    const member = await TeamMember.findById(a.memberId);
    if (!member) return;
    await Notification.updateOne(
      { dedupeKey: `${a.type}:${a.request._id}:${a.memberId}:${a.version}` },
      { $setOnInsert: { serviceRequestId: a.request._id, teamMemberId: member._id, recipient: member.email, notificationType: a.type, payload: { note: a.note }, status: "pending", nextAttemptAt: new Date() } },
      { upsert: true });
  } catch (e) { console.error("[notification] enqueue failed", e instanceof Error ? e.message : e); }
}

async function buildEmail(n: { serviceRequestId: unknown; teamMemberId?: unknown; notificationType: string; payload?: { note?: string } }) {
  const { ServiceRequest } = await import("@/models");
  const req = await ServiceRequest.findById(n.serviceRequestId), member = await TeamMember.findById(n.teamMemberId);
  if (!req || !member) throw new Error("Related request/member missing");
  const service = await Service.findById(req.serviceId);
  const a = req.address;
  const when = req.scheduledStart ? new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: member.timeZone }).format(req.scheduledStart) + ` (${member.timeZone})` : "—";
  const d: JobEmailData = {
    type: n.notificationType as Type, memberName: member.fullName, reference: req.reference, service: service?.name ?? "Service", whenLabel: when,
    customerName: req.customerName, customerEmail: req.customerEmail, customerPhone: req.customerPhone ?? undefined,
   address: a ? [a.line1, [a.postalCode, a.city].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ") : "",
    description: req.description, link: `${getEnv().APP_URL}/admin/requests/${req._id}`, note: n.payload?.note,
  };
  return jobEmail(d);
}

/** Claims one due notification atomically (safe with many workers), sends, records the result. */
async function processOne(): Promise<boolean> {
  const now = new Date();
  const n = await Notification.findOneAndUpdate(
    { $or: [{ status: "pending", nextAttemptAt: { $lte: now } }, { status: "processing", lockedUntil: { $lte: now } }] }, // 2nd branch recovers crashed workers
    { $set: { status: "processing", lockedUntil: new Date(now.getTime() + 60_000) }, $inc: { attemptCount: 1 } }, { new: true, sort: { nextAttemptAt: 1 } });
  if (!n) return false;
  try {
    const mail = await buildEmail(n);
    const r = await emailProvider.send({ to: n.recipient, ...mail, idempotencyKey: `${n._id}-${n.attemptCount}` });
    await Notification.updateOne({ _id: n._id }, { $set: { status: "sent", sentAt: new Date(), providerMessageId: r.id, lastError: null }, $unset: { lockedUntil: 1 } });
  } catch (e) {
    const msg = (e instanceof Error ? e.message : "unknown error").replace(/re_[A-Za-z0-9_]+/g, "[redacted]").slice(0, 300);
    const final = n.attemptCount >= MAX_ATTEMPTS;
    await Notification.updateOne({ _id: n._id }, { $set: { status: final ? "failed" : "pending", lastError: msg, nextAttemptAt: new Date(Date.now() + backoffMs(n.attemptCount)) }, $unset: { lockedUntil: 1 } });
  }
  return true;
}
export async function processDueNotifications(max = 20) {
  let done = 0;
  while (done < max && (await processOne())) done++;
  return done;
}

/** Manual retry of a permanently failed notification: same record (no duplicate), attempts reset. Sent ones are left alone. */
export async function retryNotification(id: string) {
  const n = await Notification.findById(id);
  if (!n) throw notFound("Notification not found");
  if (n.status === "sent") throw unprocessable("Already delivered");
  if (n.status === "processing") throw unprocessable("Currently being processed");
  await Notification.updateOne({ _id: id, status: { $in: ["failed", "pending"] } }, { $set: { status: "pending", attemptCount: 0, nextAttemptAt: new Date() } });
  await processDueNotifications(5);
}
