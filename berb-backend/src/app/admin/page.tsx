import Link from "next/link";
import { connectDb } from "@/lib/db";
import { dashboardStats } from "@/services/request.service";
import { Badge, Empty, Head } from "@/components/ui";
import { fmt } from "@/lib/format";
import { CalendarDays, CheckCheck, Clock3, HardHat, Inbox, Wrench } from "lucide-react";

type R = { _id: unknown; reference: string; customerName: string; status: string; createdAt?: Date; scheduledStart?: Date; serviceId?: { name?: string }; assignedTeamMemberId?: { fullName?: string } };
export default async function Overview() {
  await connectDb();
  const s = await dashboardStats();
  const stat = (n: number, l: string, Icon: typeof Inbox) => <div className="card stat" key={l}><span className="stat-label"><span className="stat-icon"><Icon size={16} /></span>{l}</span><b>{n}</b></div>;
  const list = (items: R[], when: "createdAt" | "scheduledStart") => items.length === 0 ? <Empty>Nothing here yet.</Empty> :
    <table><tbody>{items.map((r) => <tr key={String(r._id)}><td><Link href={`/admin/requests/${r._id}`}>{r.reference}</Link><br /><span className="muted">{r.customerName}</span></td>
      <td>{r.serviceId?.name}{r.assignedTeamMemberId?.fullName && <><br /><span className="muted">{r.assignedTeamMemberId.fullName}</span></>}</td><td>{fmt(r[when])}</td><td><Badge s={r.status} /></td></tr>)}</tbody></table>;
  return <><Head title="Overview"><Link className="btn sm out" href="/admin/schedule">Open schedule</Link><Link className="btn sm" href="/admin/requests">View requests</Link></Head>
    <div className="grid g4">{stat(s.pending, "Pending requests", Inbox)}{stat(s.assigned, "Assigned jobs", Wrench)}{stat(s.today, "Scheduled today", CalendarDays)}{stat(s.inProgress, "In progress", Clock3)}{stat(s.completed, "Completed", CheckCheck)}{stat(s.activeMembers, "Active team members", HardHat)}</div>
    <div className="grid g2" style={{ marginTop: "1rem" }}>
      <section className="card"><h2>Upcoming assignments</h2>{list(s.upcoming as unknown as R[], "scheduledStart")}</section>
      <section className="card"><h2>Recent requests</h2>{list(s.recent as unknown as R[], "createdAt")}</section></div></>;
}
