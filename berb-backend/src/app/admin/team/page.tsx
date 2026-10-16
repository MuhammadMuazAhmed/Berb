import Link from "next/link";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Service, TeamMember } from "@/models";
import { Badge, Confirm, Empty, Head } from "@/components/ui";
import { deleteTeamMemberAction } from "@/app/actions/admin";
import { TeamSavedDialog } from "./TeamSavedDialog";
import { ClickableRow } from "../ClickableRow";

export default async function Team({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string }> }) {
  await requireAdmin(); await connectDb();
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const [members, services] = await Promise.all([TeamMember.find(q ? { $or: [{ fullName: new RegExp(q, "i") }, { email: new RegExp(q, "i") }] } : {}).sort({ fullName: 1 }).lean(), Service.find().lean()]);
  const name = new Map(services.map((s) => [String(s._id), s.name]));
  return <><TeamSavedDialog saved={params.saved} /><Head title="Team"><Link className="btn" href="/admin/team/new">Add team member</Link></Head>
    <form className="card row" role="search"><div><label htmlFor="q">Search</label><input id="q" name="q" defaultValue={params.q} /></div><button className="btn out fit">Search</button></form>
    <div className="card scroll">{!members.length ? <Empty>No team members yet.</Empty> : <table><thead><tr><th>Name</th><th>Contact</th><th>Services</th><th>Status</th></tr></thead><tbody>
      {members.map((m) => <ClickableRow key={String(m._id)} href={`/admin/team/${m._id}`}><td><Link href={`/admin/team/${m._id}`}>{m.fullName}</Link></td><td>{m.email}<br /><span className="muted">{m.phone}</span></td>
        <td>{m.serviceIds.map((s) => name.get(String(s))).filter(Boolean).join(", ") || "—"}</td><td><div className="team-roster-actions"><Badge s={m.active ? "active" : "inactive"} />
          <Confirm label="Delete" danger><form action={deleteTeamMemberAction.bind(null, String(m._id))}><p>This removes the team member from the roster.</p><button className="btn sm danger" type="submit">Confirm delete</button></form></Confirm></div></td></ClickableRow>)}</tbody></table>}</div></>;
}
