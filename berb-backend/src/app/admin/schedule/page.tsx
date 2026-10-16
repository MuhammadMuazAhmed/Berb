import Link from "next/link";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { dayWindows, localYmd, zonedToUtc } from "@/lib/scheduling/engine";
import { TeamMember } from "@/models";
import { blockingJobs } from "@/services/scheduling.service";
import { Badge, Empty, Head } from "@/components/ui";
import { fmt, fmtTime } from "@/lib/format";
import { ArrowLeft, ArrowRight } from "lucide-react";

const shift = (ymd: string, n: number) => new Date(Date.parse(ymd + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
export default async function Schedule({ searchParams }: { searchParams: Promise<{ date?: string; view?: string }> }) {
  await requireAdmin(); await connectDb();
  const sp = await searchParams, tz = getEnv().BUSINESS_TIME_ZONE;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : localYmd(new Date(), tz);
  const days = sp.view === "week" ? Array.from({ length: 7 }, (_, i) => shift(date, i)) : [date];
  const members = await TeamMember.find({ active: true }).sort({ fullName: 1 });
  const step = sp.view === "week" ? 7 : 1;
  return <><Head title="Schedule"><Link className="btn sm out" href={`?date=${shift(date, -step)}&view=${sp.view ?? "day"}`}><ArrowLeft size={15} aria-hidden="true" />Prev</Link>
    <Link className="btn sm out" href={`?view=${sp.view ?? "day"}`}>Today</Link><Link className="btn sm out" href={`?date=${shift(date, step)}&view=${sp.view ?? "day"}`}>Next<ArrowRight size={15} aria-hidden="true" /></Link>
    <Link className="btn sm" href={`?date=${date}&view=${sp.view === "week" ? "day" : "week"}`}>{sp.view === "week" ? "Day view" : "Week view"}</Link></Head>
    {members.length === 0 && <Empty>No active team members.</Empty>}
    {days.map((ymd) => <section key={ymd}><h2 className="schedule-day">{new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" }).format(new Date(ymd + "T12:00:00Z"))}</h2>
      <div className="grid g2">{Promise.all(members.map(async (m) => {
        const w = dayWindows(m.workingSchedule as never, ymd, m.timeZone), s = zonedToUtc(ymd, "00:00", m.timeZone), e = new Date(s.getTime() + 864e5);
        const jobs = (await blockingJobs(String(m._id), s, e)).filter((j) => (j.scheduledStart as Date) < e && (j.scheduledEnd as Date) > s);
        const off = m.unavailablePeriods.filter((p) => p.start < e && p.end > s);
        return <div className="card schedule-member-card" key={String(m._id)}><h3><Link href={`/admin/team/${m._id}`}>{m.fullName}</Link></h3>
          <p className="muted" style={{ margin: ".3rem 0" }}>{w.work.length ? <>Working {w.work.map((x) => `${fmtTime(x.start, m.timeZone)}–${fmtTime(x.end, m.timeZone)}`).join(", ")}{w.breaks.length > 0 && <> · Break {w.breaks.map((x) => `${fmtTime(x.start, m.timeZone)}–${fmtTime(x.end, m.timeZone)}`).join(", ")}</>}</> : "Not working"}</p>
          {off.map((p, i) => <p key={i} style={{ margin: ".2rem 0" }}><Badge s="cancelled" /> Time off {fmt(p.start, m.timeZone)} – {fmt(p.end, m.timeZone)} ({p.reason})</p>)}
          {jobs.map((j) => <p key={String(j._id)} style={{ margin: ".2rem 0" }}><Badge s={j.status} /> {fmtTime(j.scheduledStart as Date, m.timeZone)}–{fmtTime(j.scheduledEnd as Date, m.timeZone)} · <Link href={`/admin/requests/${j._id}`}>{j.reference}</Link> · {j.customerName}</p>)}
          {!jobs.length && !off.length && w.work.length > 0 && <p className="muted">Fully available.</p>}</div>;
      }))}</div></section>)}</>;
}
