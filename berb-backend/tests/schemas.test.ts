import { describe, it, expect } from "vitest";
import { publicRequestSchema, teamCreateSchema, assignSchema, requestFilterSchema, dayHoursSchema, parsePreferred } from "../src/schemas";
import { envSchema } from "../src/lib/env";

const ok = { customerName: "Jane Doe", email: "JANE@x.com", service: "heating", address: "Berbstr. 1, Cologne", jobDescription: "Boiler leaks" };
describe("public request schema", () => {
  it("accepts the React client's payload and normalises", () => {
    const r = publicRequestSchema.parse(ok);
    expect(r.email).toBe("jane@x.com"); expect(r.address.line1).toBe("Berbstr. 1, Cologne"); expect(r.source).toBe("offer_form");
  });
  it("rejects bad input", () => {
    expect(publicRequestSchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
    expect(publicRequestSchema.safeParse({ ...ok, jobDescription: "" }).success).toBe(false);
    expect(publicRequestSchema.safeParse({ ...ok, source: "hacker" }).success).toBe(false);
  });
  it("accepts supported urgency values and rejects unknown ones", () => {
    expect(publicRequestSchema.parse({ ...ok, urgency: "emergency" }).urgency).toBe("emergency");
    expect(publicRequestSchema.parse(ok).urgency).toBeUndefined();
    expect(publicRequestSchema.safeParse({ ...ok, urgency: "immediate" }).success).toBe(false);
  });
  it("strips unknown / privileged fields (no mass assignment)", () => {
    const r = publicRequestSchema.parse({ ...ok, status: "assigned", assignedTeamMemberId: "x", adminNotes: "y" }) as Record<string, unknown>;
    expect(r.status).toBe(undefined); expect(r.assignedTeamMemberId).toBe(undefined); expect(r.adminNotes).toBe(undefined);
  });
  it("reads local datetimes in the business time zone", () => {
    expect(parsePreferred("2026-10-20T10:00", "Europe/Berlin")?.toISOString()).toBe("2026-10-20T08:00:00.000Z");
    expect(parsePreferred("2026-10-20T10:00:00Z", "Europe/Berlin")?.toISOString()).toBe("2026-10-20T10:00:00.000Z");
    expect(parsePreferred("garbage", "Europe/Berlin")).toBe(null);
  });
});
describe("team / schedule schemas", () => {
  const base = { fullName: "Max Mustermann", email: "m@x.com", phone: "0221123456" };
  it("applies defaults", () => expect(teamCreateSchema.parse(base).workingSchedule.length).toBe(5));
  it("rejects malformed intervals", () => {
    expect(dayHoursSchema.safeParse({ day: 1, intervals: [{ start: "17:00", end: "08:00" }], breaks: [] }).success).toBe(false);
    expect(dayHoursSchema.safeParse({ day: 1, intervals: [{ start: "08:00", end: "12:00" }], breaks: [{ start: "13:00", end: "13:30" }] }).success).toBe(false);
    expect(dayHoursSchema.safeParse({ day: 9, intervals: [], breaks: [] }).success).toBe(false);
  });
  it("rejects unknown time zone and unknown keys", () => {
    expect(teamCreateSchema.safeParse({ ...base, timeZone: "Mars/Base" }).success).toBe(false);
    expect(teamCreateSchema.safeParse({ ...base, role: "admin" }).success).toBe(false);
  });
});
describe("admin payloads", () => {
  it("validates ids and rejects extra fields", () => {
    expect(assignSchema.safeParse({ teamMemberId: "not-an-id", start: "2026-10-20T08:00:00Z" }).success).toBe(false);
    expect(assignSchema.safeParse({ teamMemberId: "a".repeat(24), start: "2026-10-20T08:00:00Z", status: "completed" }).success).toBe(false);
  });
  it("paginates with safe bounds", () => {
    expect(requestFilterSchema.parse({}).pageSize).toBe(20);
    expect(requestFilterSchema.safeParse({ pageSize: "1000" }).success).toBe(false);
    expect(requestFilterSchema.safeParse({ status: { $ne: "x" } }).success).toBe(false); // NoSQL-operator injection
  });
});
describe("env schema", () => {
  const good = { MONGODB_URI: "mongodb://localhost/x", APP_URL: "http://localhost:3000", AUTH_SECRET: "x".repeat(32), CRON_SECRET: "y".repeat(16) };
  it("accepts valid config", () => expect(envSchema.safeParse(good).success).toBe(true));
  it("detects invalid config", () => {
    expect(envSchema.safeParse({ ...good, AUTH_SECRET: "short" }).success).toBe(false);
    expect(envSchema.safeParse({ ...good, MONGODB_URI: "http://x" }).success).toBe(false);
    expect(envSchema.safeParse({ ...good, NODE_ENV: "production" }).success).toBe(false); // needs RESEND_API_KEY
  });
});
