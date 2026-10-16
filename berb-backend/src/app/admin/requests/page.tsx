import Link from "next/link";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Service } from "@/models";
import { STATUSES } from "@/lib/scheduling/status";
import { requestFilterSchema } from "@/schemas";
import { listRequests } from "@/services/request.service";
import { Badge, Empty, Flash, Head, Pager } from "@/components/ui";
import { fmt } from "@/lib/format";
import { ClickableRow } from "../ClickableRow";

export default async function Requests({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin(); await connectDb();
  const params = await searchParams;
  const sp = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined));
  const p = requestFilterSchema.safeParse(sp), f = p.success ? p.data : requestFilterSchema.parse({});
  const [res, services] = await Promise.all([listRequests(f), Service.find().sort({ name: 1 }).lean()]);
  const qs = new URLSearchParams(
  Object.entries(sp).flatMap(([k, v]): [string, string][] =>
    k === "page" || v === undefined ? [] : Array.isArray(v) ? v.map((x): [string, string] => [k, x]) : [[k, v]],
  ),
).toString();
  type R = { _id: unknown; reference: string; customerName: string; customerEmail: string; status: string; createdAt: Date; requestedStart?: Date; serviceId?: { name: string }; assignedTeamMemberId?: { fullName: string } };
  return <><Head title="Service requests" /><Flash sp={params} />
    <form className="card row" method="get" role="search">
      <div><label htmlFor="q">Search</label><input id="q" name="q" defaultValue={f.q} placeholder="Name, email, reference" /></div>
      <div><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={f.status ?? ""}><option value="">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div><label htmlFor="serviceId">Service</label><select id="serviceId" name="serviceId" defaultValue={f.serviceId ?? ""}><option value="">All</option>{services.map((s) => <option key={String(s._id)} value={String(s._id)}>{s.name}</option>)}</select></div>
      <div><label htmlFor="from">From</label><input id="from" type="date" name="from" defaultValue={sp.from} /></div>
      <div><label htmlFor="to">To</label><input id="to" type="date" name="to" defaultValue={sp.to} /></div>
      <div><label htmlFor="sort">Sort</label><select id="sort" name="sort" defaultValue={f.sort}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="scheduled">Scheduled time</option></select></div>
      <button className="btn fit">Filter</button></form>
    <div className="card scroll">{res.items.length === 0 ? <Empty>No requests match.</Empty> :
      <table><thead><tr><th>Reference</th><th>Customer</th><th>Service</th><th>Requested</th><th>Assigned</th><th>Status</th></tr></thead><tbody>
        {(res.items as unknown as R[]).map((r) => <ClickableRow key={String(r._id)} href={`/admin/requests/${r._id}`}><td><Link href={`/admin/requests/${r._id}`}>{r.reference}</Link><br /><span className="muted">{fmt(r.createdAt)}</span></td>
          <td>{r.customerName}<br /><span className="muted">{r.customerEmail}</span></td><td>{r.serviceId?.name}</td><td>{r.requestedStart ? fmt(r.requestedStart) : <span className="muted">Quote only</span>}</td>
          <td>{r.assignedTeamMemberId?.fullName ?? "—"}</td><td><Badge s={r.status} /></td></ClickableRow>)}</tbody></table>}
      <Pager base={`/admin/requests?${qs}`} page={res.page} pages={res.pages} /></div></>;
}
