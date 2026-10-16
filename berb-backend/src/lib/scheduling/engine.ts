/**
 * Pure scheduling engine (no framework / DB imports) so it is unit-testable.
 *
 * Policies
 *  - Times are UTC instants. Working hours are wall-clock "HH:mm" in the team member's IANA timeZone.
 *  - A job occupies [start, end) for work and [start, end + buffer) for blocking. The buffer applies AFTER the job.
 *    Two jobs conflict iff a.start < b.blockedEnd && a.blockedEnd > b.start (same rule everywhere).
 *  - The job itself (not the buffer) must sit inside one working interval and may not touch a break.
 *  - A job may not span midnight (it must fit in one working interval).
 */
export interface Interval { start: Date; end: Date }
export interface HM { start: string; end: string }
export interface DayHours { day: number; intervals: HM[]; breaks: HM[] } // day: 0=Sunday..6=Saturday

export type Reason = "outside_working_hours" | "during_break" | "time_off" | "conflict" | "in_the_past";

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function dtf(tz: string) {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    dtfCache.set(tz, f);
  }
  return f;
}
function tzOffsetMs(date: Date, tz: string): number {
  const p: Record<string, number> = {};
  for (const x of dtf(tz).formatToParts(date)) if (x.type !== "literal" && x.type !== "timeZoneName") p[x.type] = Number(x.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}
/** Wall-clock time in `tz` -> UTC instant. In a DST gap the time resolves to the instant just after the gap. */
export function zonedToUtc(ymd: string, hm: string, tz: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  return new Date(guess - tzOffsetMs(new Date(guess), tz));
}
export function localYmd(date: Date, tz: string): string {
  const p: Record<string, string> = {};
  for (const x of dtf(tz).formatToParts(date)) if (x.type !== "literal") p[x.type] = x.value;
  return `${p.year}-${p.month}-${p.day}`;
}
export function weekdayOfYmd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
export const addMinutes = (d: Date, min: number) => new Date(d.getTime() + min * 60_000);
export const overlaps = (a: Interval, b: Interval) => a.start < b.end && a.end > b.start;

function subtract(base: Interval[], cut: Interval[]): Interval[] {
  let out = base;
  for (const c of cut) {
    out = out.flatMap((i) => {
      if (!overlaps(i, c)) return [i];
      const r: Interval[] = [];
      if (i.start < c.start) r.push({ start: i.start, end: c.start });
      if (i.end > c.end) r.push({ start: c.end, end: i.end });
      return r;
    });
  }
  return out;
}

/** Working intervals, breaks, and the free windows (work minus breaks) for a local calendar day. */
export function dayWindows(schedule: DayHours[], ymd: string, tz: string) {
  const dh = schedule.find((s) => s.day === weekdayOfYmd(ymd));
  const conv = (l: HM[] = []) => l.map((i) => ({ start: zonedToUtc(ymd, i.start, tz), end: zonedToUtc(ymd, i.end, tz) }));
  const work = conv(dh?.intervals), breaks = conv(dh?.breaks);
  return { work, breaks, free: subtract(work, breaks) };
}

export interface SlotInput {
  schedule: DayHours[]; timeZone: string; start: Date; durationMinutes: number; bufferMinutes: number;
  /** Blocking windows (end already includes buffer) of other assigned jobs. */
  jobs: Interval[]; /** Time off / manual blocks. */ timeOff: Interval[]; now?: Date;
}
export interface SlotResult { ok: boolean; reasons: Reason[]; blocked: Interval }

export function checkSlot(i: SlotInput): SlotResult {
  const end = addMinutes(i.start, i.durationMinutes);
  const blocked = { start: i.start, end: addMinutes(end, i.bufferMinutes) };
  const reasons: Reason[] = [];
  if (i.now && i.start < i.now) reasons.push("in_the_past");
  const ymd = localYmd(i.start, i.timeZone);
  const { work, breaks, free } = dayWindows(i.schedule, ymd, i.timeZone);
  const job = { start: i.start, end };
  if (!free.some((w) => w.start <= job.start && w.end >= job.end)) {
    reasons.push(breaks.some((b) => overlaps(b, job)) && work.some((w) => w.start <= job.start && w.end >= job.end) ? "during_break" : "outside_working_hours");
  }
  if (i.timeOff.some((t) => overlaps(t, blocked))) reasons.push("time_off");
  if (i.jobs.some((j) => overlaps(j, blocked))) reasons.push("conflict");
  return { ok: reasons.length === 0, reasons, blocked };
}

/** Candidate start times (every `stepMinutes`) on a local day that pass checkSlot. */
export function findSlots(i: Omit<SlotInput, "start"> & { ymd: string; stepMinutes?: number }): Date[] {
  const step = (i.stepMinutes ?? 30) * 60_000;
  const { free } = dayWindows(i.schedule, i.ymd, i.timeZone);
  const out: Date[] = [];
  for (const w of free) {
    for (let t = w.start.getTime(); t + i.durationMinutes * 60_000 <= w.end.getTime(); t += step) {
      const start = new Date(t);
      if (checkSlot({ ...i, start }).ok) out.push(start);
    }
  }
  return out;
}
export const REASON_TEXT: Record<Reason, string> = {
  outside_working_hours: "Outside the team member's working hours",
  during_break: "Overlaps a scheduled break",
  time_off: "Overlaps time off or a blocked period",
  conflict: "Overlaps another assigned job (including its buffer)",
  in_the_past: "Start time is in the past",
};
