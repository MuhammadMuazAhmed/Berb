export const fmt = (d?: Date | string | null, tz = "Asia/Karachi") =>
  d ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(d)) : "—";
export const fmtTime = (d: Date | string, tz: string) => new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: tz }).format(new Date(d));
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
