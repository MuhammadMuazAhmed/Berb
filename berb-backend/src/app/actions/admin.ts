"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { endSession, requireAdmin, startSession, verifyLogin } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/ratelimit";
import { zonedToUtc, type DayHours } from "@/lib/scheduling/engine";
import { assignSchema, cancelSchema, defaultSchedule, loginSchema, notesSchema, objectId, rejectSchema, serviceCreateSchema, serviceUpdateSchema, statusSchema, teamCreateSchema, teamUpdateSchema } from "@/schemas";
import * as A from "@/services/assignment.service";
import { createService, updateService } from "@/services/catalog.service";
import { retryNotification } from "@/services/notification.service";
import { createMember, deleteMember, updateMember } from "@/services/team.service";
import { TeamMember } from "@/models";
import { headers } from "next/headers";

const s = (f: FormData, k: string) => { const v = f.get(k); return typeof v === "string" ? v : undefined; };
const msg = (e: unknown) => e instanceof ZodError ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
  : e instanceof AppError ? e.message + ((e.details as { reasons?: { message: string }[] } | undefined)?.reasons?.length ? " — " + (e.details as { reasons: { message: string }[] }).reasons.map((r) => r.message).join("; ")
    : (e.details as { affected?: { reference: string }[] } | undefined)?.affected ? " — jobs: " + (e.details as { affected: { reference: string }[] }).affected.map((a) => a.reference).join(", ") : "") : "Unexpected error";

/** Runs a mutation: auth + validation + service call; redirects back with ?ok= / ?error= (never leaks internals). */
async function run(back: string, fn: (adminId: string) => Promise<string | void>, successBack = back) {
  let target = back;
  try {
    await connectDb();
    const admin = await requireAdmin({ write: true });
    const ok = await fn(admin.id);
    revalidatePath("/admin", "layout");
    target = successBack + (successBack.includes("?") ? "&" : "?") + "ok=" + encodeURIComponent(ok || "Saved");
  } catch (e) {
    if (!(e instanceof AppError || e instanceof ZodError)) console.error(e);
    target = back + (back.includes("?") ? "&" : "?") + "error=" + encodeURIComponent(msg(e));
  }
  redirect(target);
}

export async function loginAction(f: FormData) {
  let ok = false;
  try {
    await connectDb();
    const body = loginSchema.parse({ email: s(f, "email"), password: s(f, "password") });
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`login-ip:${ip}`, 20, 900); await rateLimit(`login:${body.email}`, 8, 900);
    const u = await verifyLogin(body.email, body.password);
    if (u) { await startSession(u); ok = true; }
  } catch (e) { if (e instanceof AppError && e.status === 429) redirect("/admin-login?error=Too+many+attempts"); }
  redirect(ok ? "/admin" : "/admin-login?error=Invalid+email+or+password");
}
export async function logoutAction() { await endSession(); redirect("/admin-login"); }

const mk = (id: string, f: FormData) => ({ teamMemberId: s(f, "teamMemberId"), durationMinutes: s(f, "durationMinutes") ? Number(s(f, "durationMinutes")) : undefined, note: s(f, "note") || undefined, start: s(f, "start") ?? (s(f, "date") && s(f, "time") ? undefined : undefined) });
/** start comes from a suggested-slot button (ISO) or from date+time inputs, which are read in the MEMBER's time zone. */
async function startOf(f: FormData): Promise<string | undefined> {
  if (s(f, "start")) return s(f, "start");
  const date = s(f, "date"), time = s(f, "time"), mid = s(f, "teamMemberId");
  if (!date || !time || !mid) return undefined;
  const m = await TeamMember.findById(objectId.parse(mid));
  return m ? zonedToUtc(date, time, m.timeZone).toISOString() : undefined;
}
export async function assignAction(id: string, f: FormData) {
  await run(`/admin/requests/${id}`, async (admin) => { const b = assignSchema.parse({ ...mk(id, f), start: await startOf(f) }); await A.assignRequest(id, b, admin); return "Job assigned. Email queued."; }, "/admin/requests");
}
export async function rescheduleAction(id: string, f: FormData) {
  await run(`/admin/requests/${id}`, async (admin) => { const b = assignSchema.parse({ ...mk(id, f), start: await startOf(f) }); await A.rescheduleRequest(id, b, admin); return "Job rescheduled. Email queued."; });
}
export async function rejectAction(id: string, f: FormData) { await run(`/admin/requests/${id}`, async (a) => { await A.rejectRequest(id, rejectSchema.parse({ reason: s(f, "reason") }).reason, a); return "Request rejected"; }); }
export async function cancelAction(id: string, f: FormData) { await run(`/admin/requests/${id}`, async (a) => { await A.cancelRequest(id, cancelSchema.parse({ reason: s(f, "reason") || undefined }).reason, a); return "Job cancelled"; }); }
export async function progressAction(id: string, to: string) { await run(`/admin/requests/${id}`, async (a) => { await A.setProgress(id, statusSchema.parse({ status: to }).status, a); return "Status updated"; }); }
export async function notesAction(id: string, f: FormData) { await run(`/admin/requests/${id}`, async () => { await A.setNotes(id, notesSchema.parse({ adminNotes: s(f, "adminNotes") ?? "" }).adminNotes); }); }
export async function retryAction(id: string) { await run("/admin/notifications", async () => { await retryNotification(objectId.parse(id)); return "Retry processed"; }); }

// ---- services ----
const svc = (f: FormData) => ({
  name: s(f, "name"), slug: s(f, "slug"), category: s(f, "category"), description: s(f, "description") ?? "",
  defaultDurationMinutes: Number(s(f, "defaultDurationMinutes")), bufferMinutes: Number(s(f, "bufferMinutes") || 0),
  startingPrice: s(f, "startingPrice") ? Number(s(f, "startingPrice")) : undefined, active: f.get("active") === "on",
});
export async function createServiceAction(f: FormData) { await run("/admin/services", async () => { await createService(serviceCreateSchema.parse(svc(f))); return "Service created"; }); }
export async function updateServiceAction(id: string, f: FormData) { await run("/admin/services", async () => { await updateService(objectId.parse(id), serviceUpdateSchema.parse(svc(f))); return "Service updated"; }); }

// ---- team ----
function schedule(f: FormData): DayHours[] {
  const out: DayHours[] = [];
  for (let d = 0; d < 7; d++) {
    if (f.get(`w${d}`) !== "on") continue;
    const bs = s(f, `bs${d}`), be = s(f, `be${d}`);
    out.push({ day: d, intervals: [{ start: s(f, `s${d}`) ?? "", end: s(f, `e${d}`) ?? "" }], breaks: bs && be ? [{ start: bs, end: be }] : [] });
  }
  return out;
}
const team = (f: FormData) => ({
  fullName: s(f, "fullName"), email: s(f, "email"), phone: s(f, "phone"), biography: s(f, "biography") || undefined, timeZone: s(f, "timeZone") || "Asia/Karachi",
  serviceIds: f.getAll("serviceIds").map(String), active: f.get("active") === "on", workingSchedule: schedule(f),
});
export async function createTeamAction(f: FormData) {
  try { await connectDb(); await requireAdmin({ write: true }); await createMember(teamCreateSchema.parse(team(f))); }
  catch (e) { redirect("/admin/team/new?error=" + encodeURIComponent(msg(e))); }
  revalidatePath("/admin", "layout");
  redirect("/admin/team?saved=created");
}
export async function updateTeamAction(id: string, f: FormData) {
  try {
    await connectDb(); await requireAdmin({ write: true });
    await updateMember(objectId.parse(id), teamUpdateSchema.parse({ ...team(f), acknowledgeConflicts: f.get("ack") === "on" }));
    revalidatePath("/admin", "layout");
  } catch (e) {
    if (!(e instanceof AppError || e instanceof ZodError)) console.error(e);
    redirect(`/admin/team/${id}?error=${encodeURIComponent(msg(e))}`);
  }
  redirect("/admin/team?saved=updated");
}
export async function deleteTeamMemberAction(id: string) {
  await run("/admin/team", async () => { await deleteMember(objectId.parse(id)); return "Team member deleted"; });
}
export async function addTimeOffAction(id: string, f: FormData) {
  await run(`/admin/team/${id}`, async () => {
    const m = await TeamMember.findById(objectId.parse(id)); if (!m) throw new AppError(404, "Not found");
    const start = zonedToUtc(s(f, "fromDate") ?? "", s(f, "fromTime") || "00:00", m.timeZone), end = zonedToUtc(s(f, "toDate") ?? "", s(f, "toTime") || "23:59", m.timeZone);
    const periods = [...m.unavailablePeriods.map((p) => ({ start: p.start, end: p.end, reason: p.reason ?? "" })), { start, end, reason: s(f, "reason") ?? "" }];
    await updateMember(id, teamUpdateSchema.parse({ unavailablePeriods: periods, acknowledgeConflicts: f.get("ack") === "on" })); return "Time off added";
  });
}
export async function removeTimeOffAction(id: string, periodId: string) {
  await run(`/admin/team/${id}`, async () => { await TeamMember.updateOne({ _id: objectId.parse(id) }, { $pull: { unavailablePeriods: { _id: objectId.parse(periodId) } } }); return "Time off removed"; });
}

