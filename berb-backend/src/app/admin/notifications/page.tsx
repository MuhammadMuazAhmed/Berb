import Link from "next/link";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Notification } from "@/models";
import { Badge, Empty, Flash, Head, Pager } from "@/components/ui";
import { fmt } from "@/lib/format";
import { retryAction } from "../../actions/admin";
import { SubmitButton } from "@/components/SubmitButton";

export default async function Notifications({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin(); await connectDb();
  const sp = await searchParams, page = Math.max(1, Number(sp.page) || 1);
  const f = ["pending", "processing", "sent", "failed"].includes(sp.status) ? { status: sp.status } : {};
  const [items, total] = await Promise.all([Notification.find(f).select("-payload").sort({ createdAt: -1 }).skip((page - 1) * 25).limit(25).populate("serviceRequestId", "reference").lean(), Notification.countDocuments(f)]);
  return <><Head title="Notifications" /><Flash sp={sp} />
    <form className="card row" role="search"><div><label htmlFor="st">Status</label><select id="st" name="status" defaultValue={sp.status ?? ""}><option value="">All</option>{["pending", "processing", "sent", "failed"].map((s) => <option key={s}>{s}</option>)}</select></div><button className="btn out fit">Filter</button></form>
    <div className="card scroll">{!items.length ? <Empty>No notifications.</Empty> : <table><thead><tr><th>Type</th><th>Recipient</th><th>Request</th><th>Created</th><th>Status</th><th>Attempts</th><th>Last error</th><th /></tr></thead><tbody>
      {items.map((n: any) => <tr key={String(n._id)}><td>{n.notificationType.replace("_", " ")}</td><td>{n.recipient}</td><td>{n.serviceRequestId && <Link href={`/admin/requests/${n.serviceRequestId._id}`}>{n.serviceRequestId.reference}</Link>}</td>
        <td>{fmt(n.createdAt)}</td><td><Badge s={n.status} /></td><td>{n.attemptCount}</td><td className="muted">{n.lastError ?? "—"}</td>
        <td>{n.status !== "sent" && n.status !== "processing" && <form action={retryAction.bind(null, String(n._id))}><SubmitButton className="btn sm out" pendingLabel="Retrying...">Retry</SubmitButton></form>}</td></tr>)}</tbody></table>}
      <Pager base={`/admin/notifications?status=${sp.status ?? ""}`} page={page} pages={Math.max(1, Math.ceil(total / 25))} /></div></>;
}
