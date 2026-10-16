import "server-only";
import { Service, ServiceRequest, TeamMember } from "@/models";
import { AppError, conflict, notFound, unprocessable } from "@/lib/errors";
import { REASON_TEXT, addMinutes, checkSlot } from "@/lib/scheduling/engine";
import { canTransition, type Status } from "@/lib/scheduling/status";
import type { AssignInput } from "@/schemas";
import { acquireLock, blockingJobs, jobIntervals, memberSlotInput, releaseLock, renewLock } from "./scheduling.service";
import { queueNotification } from "./notification.service";

/** Assign (pending -> assigned) or reschedule (assigned -> assigned). Authoritative server-side re-validation under a per-member lock. */
async function schedule(mode: "assign" | "reschedule", requestId: string, input: AssignInput, adminId: string) {
  const req = await ServiceRequest.findById(requestId);
  if (!req) throw notFound("Request not found");
  if (mode === "assign" ? req.status !== "pending" : req.status !== "assigned")
    throw unprocessable(`Cannot ${mode} a request in status "${req.status}"`);
  const service = await Service.findById(req.serviceId);
  if (!service) throw unprocessable("The requested service no longer exists");

  const member = await TeamMember.findById(input.teamMemberId);
  if (!member) throw notFound("Team member not found");
  if (!member.active) throw unprocessable("Team member is inactive");
  if (!member.serviceIds.some((s) => String(s) === String(service._id))) throw unprocessable("Team member is not qualified for this service");

  const lockMember = String(member._id);
  const owner = await acquireLock(lockMember);
  if (!owner) throw conflict("This team member is being scheduled by someone else right now. Please retry.");
  try {
    const fresh = await TeamMember.findById(member._id); // re-read under the lock
    if (!fresh || !fresh.active) throw unprocessable("Team member is inactive");
    const duration = input.durationMinutes ?? req.durationMinutes ?? service.defaultDurationMinutes;
    const buffer = service.bufferMinutes;
    const start = input.start;
    const end = addMinutes(start, duration), blockedEnd = addMinutes(end, buffer);
    const jobs = await blockingJobs(lockMember, new Date(start.getTime() - 864e5), new Date(blockedEnd.getTime() + 864e5), requestId);
    const res = checkSlot({ ...memberSlotInput(fresh), start, durationMinutes: duration, bufferMinutes: buffer, jobs: jobIntervals(jobs), now: new Date() });
    if (!res.ok) throw conflict("The selected time is not available", { reasons: res.reasons.map((r) => ({ code: r, message: REASON_TEXT[r] })) });

    if (!(await renewLock(lockMember, owner))) throw conflict("Scheduling lock was lost; nothing was saved. Please retry.");
    const prev = { status: req.status, member: req.assignedTeamMemberId, start: req.scheduledStart };
    const updated = await ServiceRequest.findOneAndUpdate(
      { _id: requestId, status: req.status, assignedTeamMemberId: prev.member ?? null, scheduledStart: prev.start ?? null }, // optimistic: nobody changed it meanwhile
      {
        $set: { status: "assigned", assignedTeamMemberId: member._id, scheduledStart: start, scheduledEnd: end, blockedEnd, durationMinutes: duration, bufferMinutes: buffer },
        $push: { assignmentHistory: { action: mode === "assign" ? "assigned" : "rescheduled", teamMemberId: member._id, start, end, status: "assigned", note: input.note, by: adminId, at: new Date() } },
      }, { new: true });
    if (!updated) throw conflict("The request was changed by someone else. Reload and try again.");
    const version = updated.assignmentHistory.length;
    if (mode === "reschedule" && prev.member && String(prev.member) !== String(member._id))
      await queueNotification({ request: updated, memberId: String(prev.member), type: "job_cancelled", version, note: "Re-assigned to another team member" });
    await queueNotification({ request: updated, memberId: String(member._id), type: mode === "assign" ? "job_assigned" : "job_rescheduled", version });
    return updated;
  } finally { await releaseLock(lockMember, owner); }
}
export const assignRequest = (id: string, i: AssignInput, adminId: string) => schedule("assign", id, i, adminId);
export const rescheduleRequest = (id: string, i: AssignInput, adminId: string) => schedule("reschedule", id, i, adminId);

async function transition(id: string, to: Status, adminId: string, extra: Record<string, unknown> = {}, note?: string) {
  const req = await ServiceRequest.findById(id);
  if (!req) throw notFound("Request not found");
  if (!canTransition(req.status as Status, to)) throw unprocessable(`Invalid status transition: ${req.status} -> ${to}`);
  const updated = await ServiceRequest.findOneAndUpdate({ _id: id, status: req.status }, {
    $set: { status: to, ...extra },
    $push: { assignmentHistory: { action: to === "rejected" ? "rejected" : to === "cancelled" ? "cancelled" : "status_changed", status: to, note, teamMemberId: req.assignedTeamMemberId, by: adminId, at: new Date() } },
  }, { new: true });
  if (!updated) throw conflict("The request was changed by someone else. Reload and try again.");
  return { updated, previous: req };
}
export const rejectRequest = async (id: string, reason: string, adminId: string) => (await transition(id, "rejected", adminId, { rejectionReason: reason }, reason)).updated;
export const setProgress = async (id: string, to: "in_progress" | "completed", adminId: string) => (await transition(id, to, adminId)).updated;
/** Cancelling releases the calendar block (availability only counts assigned/in_progress), and tells the member. */
export async function cancelRequest(id: string, reason: string | undefined, adminId: string) {
  const { updated, previous } = await transition(id, "cancelled", adminId, { cancellationReason: reason, blockedEnd: null }, reason);
  if (previous.assignedTeamMemberId && ["assigned", "in_progress"].includes(previous.status))
    await queueNotification({ request: updated, memberId: String(previous.assignedTeamMemberId), type: "job_cancelled", version: updated.assignmentHistory.length, note: reason });
  return updated;
}
export const setNotes = async (id: string, adminNotes: string) => {
  const r = await ServiceRequest.findByIdAndUpdate(id, { $set: { adminNotes } }, { new: true });
  if (!r) throw notFound("Request not found");
  return r;
};
export { AppError };
