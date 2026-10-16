import "server-only";
import { ServiceRequest } from "@/models";
import { notFound, unprocessable } from "@/lib/errors";
import { REASON_TEXT, checkSlot, dayWindows, findSlots, zonedToUtc } from "@/lib/scheduling/engine";
import { blockingJobs, jobIntervals, memberSlotInput, qualifiedMembers } from "./scheduling.service";

/** Read-only view for the dashboard. Advisory only: assignRequest() re-validates under a lock. */
export async function availabilityFor(a: { requestId: string; date: string; teamMemberId?: string; start?: Date; durationMinutes?: number }) {
  const req = await ServiceRequest.findById(a.requestId).populate<{ serviceId: { _id: unknown; bufferMinutes: number; defaultDurationMinutes: number; name: string } }>("serviceId");
  if (!req) throw notFound("Request not found");
  if (!req.serviceId) throw unprocessable("Service missing");
  const duration = a.durationMinutes ?? req.durationMinutes, buffer = req.serviceId.bufferMinutes;
  let members = await qualifiedMembers(String(req.serviceId._id));
  if (a.teamMemberId) members = members.filter((m) => String(m._id) === a.teamMemberId);
  const out = [];
  for (const m of members) {
    const dayStart = zonedToUtc(a.date, "00:00", m.timeZone), dayEnd = new Date(dayStart.getTime() + 864e5);
    const jobs = await blockingJobs(String(m._id), new Date(dayStart.getTime() - 864e5), new Date(dayEnd.getTime() + 864e5), a.requestId);
    const base = { ...memberSlotInput(m), durationMinutes: duration, bufferMinutes: buffer, jobs: jobIntervals(jobs), now: new Date() };
    const w = dayWindows(base.schedule, a.date, m.timeZone);
    const check = a.start ? checkSlot({ ...base, start: a.start }) : null;
    out.push({
      teamMemberId: String(m._id), fullName: m.fullName, timeZone: m.timeZone,
      working: w.work, breaks: w.breaks,
      timeOff: m.unavailablePeriods.filter((p) => p.start < dayEnd && p.end > dayStart).map((p) => ({ start: p.start, end: p.end, reason: p.reason })),
      jobs: jobs.filter((j) => (j.scheduledStart as Date) < dayEnd && (j.scheduledEnd as Date) > dayStart),
      proposed: check && { start: a.start, ok: check.ok, reasons: check.reasons.map((r) => ({ code: r, message: REASON_TEXT[r] })) },
      suggestedSlots: findSlots({ ...base, ymd: a.date }),
    });
  }
  return { requestId: a.requestId, date: a.date, durationMinutes: duration, bufferMinutes: buffer, members: out };
}
