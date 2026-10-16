import "server-only";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { ScheduleLock, ServiceRequest, TeamMember } from "@/models";
import { checkSlot, type Interval, type DayHours } from "@/lib/scheduling/engine";
import { BLOCKING } from "@/lib/scheduling/status";

const LOCK_MS = 15_000;
const isDup = (e: unknown) => (e as { code?: number }).code === 11000;

/**
 * Per-member distributed mutex. The lock document's _id is the team member id, so MongoDB's unique-_id
 * guarantee makes acquisition atomic across ALL app instances. Expired locks (crashed holder) are taken over
 * atomically with a conditional findOneAndUpdate; a TTL index removes abandoned docs. Returns an owner token or null.
 */
export async function acquireLock(memberId: string): Promise<string | null> {
  const owner = randomUUID(), now = new Date(), expiresAt = new Date(now.getTime() + LOCK_MS);
  const id = new Types.ObjectId(memberId);
  const taken = await ScheduleLock.findOneAndUpdate({ _id: id, expiresAt: { $lte: now } }, { $set: { owner, expiresAt } });
  if (taken) return owner;
  try { await ScheduleLock.create({ _id: id, owner, expiresAt }); return owner; }
  catch (e) { if (isDup(e)) return null; throw e; }
}
/** Extends the lock iff we still own it and it hasn't expired. false => we lost it; the caller MUST abort. */
export async function renewLock(memberId: string, owner: string): Promise<boolean> {
  const now = new Date();
  const r = await ScheduleLock.updateOne({ _id: memberId, owner, expiresAt: { $gt: now } }, { $set: { expiresAt: new Date(now.getTime() + LOCK_MS) } });
  return r.matchedCount === 1;
}
export const releaseLock = (memberId: string, owner: string) => ScheduleLock.deleteOne({ _id: memberId, owner });

/** Blocking windows of a member's active jobs overlapping [from, to]. Pending/rejected/cancelled/completed never block. */
export async function blockingJobs(memberId: string, from: Date, to: Date, excludeRequestId?: string) {
  const q: Record<string, unknown> = {
    assignedTeamMemberId: memberId, status: { $in: BLOCKING }, scheduledStart: { $lt: to }, blockedEnd: { $gt: from },
  };
  if (excludeRequestId) q._id = { $ne: excludeRequestId };
  return ServiceRequest.find(q).select("reference scheduledStart scheduledEnd blockedEnd status customerName").sort({ scheduledStart: 1 }).lean();
}
export const jobIntervals = (jobs: { scheduledStart?: Date | null; blockedEnd?: Date | null }[]): Interval[] =>
  jobs.map((j) => ({ start: j.scheduledStart as Date, end: j.blockedEnd as Date }));

export const memberSlotInput = (m: { workingSchedule: unknown; timeZone: string; unavailablePeriods: { start: Date; end: Date }[] }) => ({
  schedule: m.workingSchedule as DayHours[], timeZone: m.timeZone,
  timeOff: m.unavailablePeriods.map((p) => ({ start: p.start, end: p.end })),
});

export async function qualifiedMembers(serviceId: string) {
  return TeamMember.find({ active: true, serviceIds: serviceId }).sort({ fullName: 1 });
}
export { checkSlot };
