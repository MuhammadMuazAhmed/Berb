import { describe, it, expect } from "vitest";
import { checkSlot, findSlots, zonedToUtc, type DayHours } from "../src/lib/scheduling/engine";
import { canTransition } from "../src/lib/scheduling/status";

const TZ = "Europe/Berlin";
const weekdays: DayHours[] = [1, 2, 3, 4, 5].map((day) => ({ day, intervals: [{ start: "08:00", end: "17:00" }], breaks: [{ start: "12:00", end: "12:30" }] }));
// 2026-10-14 is a Wednesday (CEST, UTC+2)
const at = (hm: string, ymd = "2026-10-14") => zonedToUtc(ymd, hm, TZ);
const base = { schedule: weekdays, timeZone: TZ, durationMinutes: 60, bufferMinutes: 15, jobs: [], timeOff: [] };

describe("zonedToUtc", () => {
  it("handles summer and winter offsets", () => {
    expect(zonedToUtc("2026-10-14", "10:00", TZ).toISOString()).toBe("2026-10-14T08:00:00.000Z");
    expect(zonedToUtc("2026-12-14", "10:00", TZ).toISOString()).toBe("2026-12-14T09:00:00.000Z");
  });
  it("does not double-apply Berlin offset for a customer wall-clock request", () => {
    const d = zonedToUtc("2026-10-14", "15:04", TZ);
    expect(d.toISOString()).toBe("2026-10-14T13:04:00.000Z");
    expect(new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(d)).toBe("14 Oct 2026, 15:04");
  });
});
describe("checkSlot", () => {
  it("accepts a free slot inside working hours", () => expect(checkSlot({ ...base, start: at("09:00") }).ok).toBe(true));
  it("rejects outside working hours", () => {
    expect(checkSlot({ ...base, start: at("07:00") }).reasons).toContain("outside_working_hours");
    expect(checkSlot({ ...base, start: at("16:30") }).reasons).toContain("outside_working_hours");
  });
  it("rejects non-working days", () => expect(checkSlot({ ...base, start: at("09:00", "2026-10-17") }).reasons).toContain("outside_working_hours"));
  it("rejects slots overlapping a break", () => expect(checkSlot({ ...base, start: at("11:30") }).reasons).toContain("during_break"));
  it("rejects time off", () => {
    const timeOff = [{ start: at("09:30"), end: at("10:30") }];
    expect(checkSlot({ ...base, timeOff, start: at("09:00") }).reasons).toContain("time_off");
  });
  it("uses interval overlap, not equal start: 10:30-11:30 vs 11:00-12:00", () => {
    const jobs = [{ start: at("11:00"), end: at("12:00") }];
    expect(checkSlot({ ...base, jobs, start: at("10:30") }).reasons).toContain("conflict");
  });
  it("applies buffer after a job: 09:00-10:00 (+15) blocks 10:00 but not 10:15", () => {
    const jobs = [{ start: at("09:00"), end: at("10:15") }];
    expect(checkSlot({ ...base, jobs, start: at("10:00") }).ok).toBe(false);
    expect(checkSlot({ ...base, jobs, start: at("10:15") }).ok).toBe(true);
  });
  it("proposed buffer also counts: 08:45-09:45(+15) collides with a job at 09:50", () => {
    const jobs = [{ start: at("09:50"), end: at("10:50") }];
    expect(checkSlot({ ...base, jobs, start: at("08:45") }).ok).toBe(false);
    expect(checkSlot({ ...base, jobs, start: at("08:30") }).ok).toBe(true);
  });
  it("rejects past times", () => expect(checkSlot({ ...base, start: at("09:00"), now: at("10:00") }).reasons).toContain("in_the_past"));
  it("accepts a 120-minute job ending exactly at 17:00 in Berlin", () => {
    expect(checkSlot({ ...base, start: at("15:00"), durationMinutes: 120 }).ok).toBe(true);
    expect(checkSlot({ ...base, start: at("15:01"), durationMinutes: 120 }).ok).toBe(false);
  });
});
describe("findSlots", () => {
  it("never suggests conflicting or break slots", () => {
    const jobs = [{ start: at("09:00"), end: at("10:15") }];
    const slots = findSlots({ ...base, jobs, ymd: "2026-10-14" });
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) expect(checkSlot({ ...base, jobs, start: s }).ok).toBe(true);
    expect(slots.some((s) => s.getTime() === at("09:00").getTime())).toBe(false);
  });
  it("returns nothing on a non-working day", () => expect(findSlots({ ...base, ymd: "2026-10-17" })).toHaveLength(0));
});
describe("status transitions", () => {
  it("allows and rejects correctly", () => {
    expect(canTransition("pending", "assigned")).toBe(true);
    expect(canTransition("pending", "completed")).toBe(false);
    expect(canTransition("completed", "cancelled")).toBe(false);
    expect(canTransition("assigned", "in_progress")).toBe(true);
  });
});
