import { z } from "zod";
import { STATUSES } from "@/lib/scheduling/status";
import { zonedToUtc } from "@/lib/scheduling/engine";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");
const hmInterval = z.object({ start: hm, end: hm }).strict().refine((i) => i.start < i.end, "End must be after start");
const noOverlap = (l: { start: string; end: string }[]) => [...l].sort((a, b) => a.start.localeCompare(b.start)).every((x, i, a) => i === 0 || a[i - 1].end <= x.start);

export const dayHoursSchema = z.object({
  day: z.number().int().min(0).max(6),
  intervals: z.array(hmInterval).max(4),
  breaks: z.array(hmInterval).max(6),
}).strict().superRefine((d, ctx) => {
  if (!noOverlap(d.intervals)) ctx.addIssue({ code: "custom", message: "Working intervals overlap", path: ["intervals"] });
  if (!noOverlap(d.breaks)) ctx.addIssue({ code: "custom", message: "Breaks overlap", path: ["breaks"] });
  if (!d.breaks.every((b) => d.intervals.some((i) => i.start <= b.start && i.end >= b.end)))
    ctx.addIssue({ code: "custom", message: "Each break must be inside a working interval", path: ["breaks"] });
});
export const workingScheduleSchema = z.array(dayHoursSchema).max(7)
  .refine((a) => new Set(a.map((d) => d.day)).size === a.length, "Duplicate weekday");

export const timeZoneSchema = z.string().refine((tz) => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } }, "Unknown IANA time zone");
export const unavailablePeriodSchema = z.object({
  start: z.coerce.date(), end: z.coerce.date(), reason: z.string().trim().min(1).max(200),
}).strict().refine((p) => p.end > p.start, "End must be after start");

export const defaultSchedule = [1, 2, 3, 4, 5].map((day) => ({ day, intervals: [{ start: "08:00", end: "17:00" }], breaks: [{ start: "12:00", end: "12:30" }] }));

// ---------- services ----------
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase letters, numbers and dashes").max(60);
export const serviceCreateSchema = z.object({
  name: z.string().trim().min(2).max(80), slug,
  description: z.string().trim().max(1000).default(""),
  category: slug,
  defaultDurationMinutes: z.number().int().min(15).max(720),
  bufferMinutes: z.number().int().min(0).max(240).default(0),
  startingPrice: z.number().min(0).max(1_000_000).optional(),
  active: z.boolean().default(true),
}).strict();
export const serviceUpdateSchema = serviceCreateSchema.partial();

// ---------- team ----------
export const teamCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().min(5).max(30),
  profileImage: z.string().url().max(500).optional(),
  biography: z.string().trim().max(1000).optional(),
  serviceIds: z.array(objectId).max(50).default([]),
  active: z.boolean().default(true),
  timeZone: timeZoneSchema.default("Asia/Karachi"),
  workingSchedule: workingScheduleSchema.default(defaultSchedule),
  unavailablePeriods: z.array(unavailablePeriodSchema).max(200).default([]),
}).strict();
export const teamUpdateSchema = teamCreateSchema.partial().extend({ acknowledgeConflicts: z.boolean().optional() }).strict();

// ---------- public service request ----------
export const addressSchema = z.object({
  line1: z.string().trim().min(3).max(200), city: z.string().trim().max(100).default(""),
  postalCode: z.string().trim().max(20).optional(), country: z.string().trim().max(60).default("DE"),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
});
/** Accepts ISO with offset/Z (exact), a local "YYYY-MM-DDTHH:mm" or a date-only value (both read in BUSINESS_TIME_ZONE; date-only => 09:00). */
export function parsePreferred(v: string, tz: string): Date | null {
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(v)) { const d = new Date(v); return isNaN(+d) ? null : d; }
  const m = v.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (!m) return null;
  const d = zonedToUtc(m[1], m[2] ?? "09:00", tz);
  return isNaN(+d) ? null : d;
}
export const publicRequestSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email").max(200),
  phone: z.string().trim().min(5, "Invalid phone").max(30).optional(),
  /** slug, name or id of an active service */
  service: z.string().trim().min(1, "Please select a service").max(100),
  address: z.union([z.string().trim().min(3, "Please enter the service address").max(300).transform((line1) => ({ line1, city: "", country: "DE" })), addressSchema]),
  preferredDate: z.string().trim().max(40).optional(),
  jobDescription: z.string().trim().min(5, "Please describe the work").max(3000),
  additionalInfo: z.string().trim().max(1000).optional(),
  urgency: z.enum(["emergency", "urgent", "standard"]).optional(),
  requestType: z.enum(["service_request", "quote_request"]).optional(),
  source: z.enum(["service_page", "offer_form"]).default("offer_form"),
  /** honeypot: real users leave it empty */
  website: z.string().max(200).optional(),
}); // unknown keys are stripped (never persisted) => no mass assignment

// ---------- admin ----------
export const requestFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(STATUSES).optional(),
  serviceId: objectId.optional(),
  from: z.coerce.date().optional(), to: z.coerce.date().optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "oldest", "scheduled"]).default("newest"),
});
export const assignSchema = z.object({
  teamMemberId: objectId, start: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(720).optional(), note: z.string().trim().max(500).optional(),
}).strict();
export const rejectSchema = z.object({ reason: z.string().trim().min(3).max(500) }).strict();
export const cancelSchema = z.object({ reason: z.string().trim().max(500).optional() }).strict();
export const statusSchema = z.object({ status: z.enum(["in_progress", "completed"]) }).strict();
export const notesSchema = z.object({ adminNotes: z.string().trim().max(2000) }).strict();
export const availabilityQuerySchema = z.object({
  requestId: objectId, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), teamMemberId: objectId.optional(),
  start: z.coerce.date().optional(), durationMinutes: z.coerce.number().int().min(15).max(720).optional(),
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) }).strict();
export const adminCreateSchema = z.object({
  name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12, "At least 12 characters").max(200),
}).strict();
export const initialAdminSetupSchema = adminCreateSchema.extend({ setupSecret: z.string().min(1).max(512) }).strict();
export const managedAdminCreateSchema = adminCreateSchema.extend({ role: z.enum(["admin", "viewer"]).default("admin") }).strict();
export const managedAdminUpdateSchema = z.object({
  id: objectId, role: z.enum(["admin", "viewer"]), active: z.boolean(),
}).strict();

export type PublicRequestInput = z.output<typeof publicRequestSchema>;
export type TeamCreateInput = z.output<typeof teamCreateSchema>;
export type TeamUpdateInput = z.output<typeof teamUpdateSchema>;
export type ServiceInput = z.output<typeof serviceCreateSchema>;
export type AssignInput = z.output<typeof assignSchema>;
export type RequestFilter = z.output<typeof requestFilterSchema>;
