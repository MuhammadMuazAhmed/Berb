import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Types, type FilterQuery } from "mongoose";
import { Service, ServiceRequest } from "@/models";
import { getEnv } from "@/lib/env";
import { badRequest, notFound, unprocessable } from "@/lib/errors";
import { addMinutes } from "@/lib/scheduling/engine";
import { parsePreferred, type PublicRequestInput, type RequestFilter } from "@/schemas";

const B32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newReference = () => "BERB-" + Array.from(randomBytes(8), (b) => B32[b % 32]).join("");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Resolve by id, slug or (case-insensitive) name. Only ACTIVE services accept requests. */
export async function resolveActiveService(ref: string) {
  const q: FilterQuery<unknown>[] = [{ slug: ref.toLowerCase() }, { name: new RegExp(`^${esc(ref)}$`, "i") }];
  if (Types.ObjectId.isValid(ref) && ref.length === 24) q.push({ _id: ref });
  const s = await Service.findOne({ $or: q });
  if (!s) throw unprocessable("Unknown service", { field: "service" });
  if (!s.active) throw unprocessable("This service is currently not available", { field: "service" });
  return s;
}

export async function createPublicRequest(input: PublicRequestInput) {
  const service = await resolveActiveService(input.service);
  let requestedStart: Date | undefined, requestedEnd: Date | undefined;
  if (input.preferredDate) {
    const d = parsePreferred(input.preferredDate, getEnv().BUSINESS_TIME_ZONE);
    if (!d) throw badRequest("Invalid preferred date", { field: "preferredDate" });
    if (d.getTime() < Date.now() - 5 * 60_000) throw unprocessable("Preferred date is in the past", { field: "preferredDate" });
    if (d.getTime() > Date.now() + 2 * 365 * 864e5) throw unprocessable("Preferred date is too far in the future", { field: "preferredDate" });
    requestedStart = d; requestedEnd = addMinutes(d, service.defaultDurationMinutes); // duration is ALWAYS server-side
  }
  const dedupeHash = createHash("sha256").update([input.email, String(service._id), input.address.line1, input.jobDescription].join("|").toLowerCase()).digest("hex");
  const dup = await ServiceRequest.findOne({ dedupeHash, createdAt: { $gt: new Date(Date.now() - 10 * 60_000) } });
  if (dup) return { reference: dup.reference, status: dup.status, duplicate: true };

  const doc = await ServiceRequest.create({
    reference: newReference(),
    customerName: input.customerName, customerEmail: input.email, customerPhone: input.phone,
    serviceId: service._id, source: input.source, urgency: input.urgency,
    requestType: input.requestType ?? (requestedStart ? "service_request" : "quote_request"),
    address: input.address, requestedStart, requestedEnd,
    durationMinutes: service.defaultDurationMinutes, bufferMinutes: service.bufferMinutes,
    description: input.jobDescription, additionalInfo: input.additionalInfo,
    status: "pending", // never auto-assigned, never blocks a calendar
    dedupeHash,
  });
  return { reference: doc.reference, status: doc.status, duplicate: false };
}

export async function listRequests(f: RequestFilter) {
  const q: FilterQuery<unknown> = {};
  if (f.status) q.status = f.status;
  if (f.serviceId) q.serviceId = f.serviceId;
  if (f.from || f.to) q.createdAt = { ...(f.from && { $gte: f.from }), ...(f.to && { $lte: f.to }) };
  if (f.q) { const r = new RegExp(esc(f.q), "i"); q.$or = [{ customerName: r }, { customerEmail: r }, { reference: r }]; }
  const sort = f.sort === "oldest" ? { createdAt: 1 } : f.sort === "scheduled" ? { scheduledStart: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    ServiceRequest.find(q).sort(sort as never).skip((f.page - 1) * f.pageSize).limit(f.pageSize)
      .populate("serviceId", "name slug").populate("assignedTeamMemberId", "fullName").lean(),
    ServiceRequest.countDocuments(q),
  ]);
  return { items, total, page: f.page, pageSize: f.pageSize, pages: Math.max(1, Math.ceil(total / f.pageSize)) };
}

export async function getRequest(id: string) {
  const r = await ServiceRequest.findById(id).populate("serviceId").populate("assignedTeamMemberId", "fullName email phone").lean();
  if (!r) throw notFound("Request not found");
  return r;
}

export async function dashboardStats() {
  const now = new Date(), tz = getEnv().BUSINESS_TIME_ZONE;
  const { localYmd, zonedToUtc } = await import("@/lib/scheduling/engine");
  const ymd = localYmd(now, tz);
  const dayStart = zonedToUtc(ymd, "00:00", tz), dayEnd = new Date(dayStart.getTime() + 864e5);
  const { TeamMember } = await import("@/models");
  const [byStatus, today, activeMembers, upcoming, recent] = await Promise.all([
    ServiceRequest.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ServiceRequest.countDocuments({ status: { $in: ["assigned", "in_progress"] }, scheduledStart: { $gte: dayStart, $lt: dayEnd } }),
    TeamMember.countDocuments({ active: true }),
    ServiceRequest.find({ status: "assigned", scheduledStart: { $gte: now } }).sort({ scheduledStart: 1 }).limit(5).populate("assignedTeamMemberId", "fullName").populate("serviceId", "name").lean(),
    ServiceRequest.find().sort({ createdAt: -1 }).limit(5).populate("serviceId", "name").lean(),
  ]);
  const c = Object.fromEntries(byStatus.map((x: { _id: string; n: number }) => [x._id, x.n]));
  return { pending: c.pending ?? 0, assigned: c.assigned ?? 0, inProgress: c.in_progress ?? 0, completed: c.completed ?? 0, today, activeMembers, upcoming, recent };
}
