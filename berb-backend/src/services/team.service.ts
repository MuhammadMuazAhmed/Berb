import "server-only";
import { Service, ServiceRequest, TeamMember } from "@/models";
import { conflict, notFound, unprocessable } from "@/lib/errors";
import { checkSlot, type DayHours } from "@/lib/scheduling/engine";
import { BLOCKING } from "@/lib/scheduling/status";
import type { TeamCreateInput, TeamUpdateInput } from "@/schemas";

async function assertServicesExist(ids: string[]) {
  if (!ids.length) return;
  const n = await Service.countDocuments({ _id: { $in: ids } });
  if (n !== new Set(ids).size) throw unprocessable("One or more services do not exist", { field: "serviceIds" });
}
const futureJobs = (memberId: string) =>
  ServiceRequest.find({ assignedTeamMemberId: memberId, status: { $in: BLOCKING }, scheduledEnd: { $gte: new Date() } }).sort({ scheduledStart: 1 }).lean();

export async function createMember(input: TeamCreateInput) {
  await assertServicesExist(input.serviceIds);
  try { return await TeamMember.create(input); }
  catch (e) { if ((e as { code?: number }).code === 11000) throw conflict("A team member with this email already exists"); throw e; }
}

/**
 * Future jobs that would no longer be valid under the proposed hours/time off/qualifications/active flag.
 * (Conflicts between jobs themselves can't change, so only hours, time off and qualification are re-checked.)
 */
export async function affectedJobs(memberId: string, next: { active?: boolean; workingSchedule?: unknown; timeZone?: string; unavailablePeriods?: { start: Date; end: Date }[]; serviceIds?: string[] }, current: { workingSchedule: unknown; timeZone: string; unavailablePeriods: { start: Date; end: Date }[] }) {
  const jobs = await futureJobs(memberId);
  const affected: { id: string; reference: string; start: Date; reasons: string[] }[] = [];
  for (const j of jobs) {
    const reasons: string[] = [];
    if (next.active === false) reasons.push("member deactivated");
    if (next.serviceIds && !next.serviceIds.includes(String(j.serviceId))) reasons.push("no longer qualified for this service");
    if (next.workingSchedule || next.timeZone || next.unavailablePeriods) {
      const r = checkSlot({
        schedule: (next.workingSchedule ?? current.workingSchedule) as DayHours[], timeZone: next.timeZone ?? current.timeZone,
        timeOff: (next.unavailablePeriods ?? current.unavailablePeriods).map((p) => ({ start: p.start, end: p.end })),
        start: j.scheduledStart as Date, durationMinutes: j.durationMinutes, bufferMinutes: j.bufferMinutes ?? 0, jobs: [],
      });
      reasons.push(...r.reasons.filter((x) => x !== "conflict").map((x) => x.replaceAll("_", " ")));
    }
    if (reasons.length) affected.push({ id: String(j._id), reference: j.reference, start: j.scheduledStart as Date, reasons });
  }
  return affected;
}

export async function updateMember(id: string, input: TeamUpdateInput) {
  const m = await TeamMember.findById(id);
  if (!m) throw notFound("Team member not found");
  const { acknowledgeConflicts, ...patch } = input;
  if (patch.serviceIds) await assertServicesExist(patch.serviceIds);
  const risky = patch.active === false || patch.workingSchedule || patch.timeZone || patch.unavailablePeriods || patch.serviceIds;
  if (risky) {
    const affected = await affectedJobs(id, patch, m);
    if (affected.length && patch.active === false)
      throw conflict("Cannot deactivate: this member has future jobs. Reschedule or cancel them first.", { affected });
    if (affected.length && !acknowledgeConflicts)
      throw conflict("This change affects existing assigned jobs. Resolve them or confirm to continue.", { affected, canAcknowledge: true });
  }
  m.set(patch);
  try { await m.save(); } catch (e) { if ((e as { code?: number }).code === 11000) throw conflict("Email already in use"); throw e; }
  return m;
}

export async function deleteMember(id: string) {
  const m = await TeamMember.findById(id);
  if (!m) throw notFound("Team member not found");
  const affected = await futureJobs(id);
  if (affected.length) {
    throw conflict("Cannot delete this team member while future assigned jobs still exist. Reschedule or cancel them first.", {
      affected: affected.map((j) => ({ reference: j.reference, start: j.scheduledStart, id: String(j._id) })),
    });
  }
  const result = await TeamMember.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw notFound("Team member not found");
  return m;
}
