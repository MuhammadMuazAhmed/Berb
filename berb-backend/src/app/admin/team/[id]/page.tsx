import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Service, TeamMember } from "@/models";
import { objectId } from "@/schemas";
import { Confirm, Flash, Head } from "@/components/ui";
import { fmt } from "@/lib/format";
import { addTimeOffAction, deleteTeamMemberAction, removeTimeOffAction, updateTeamAction } from "../../../actions/admin";
import { TeamForm } from "../TeamForm";
import { SubmitButton } from "@/components/SubmitButton";

export default async function Member({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  await requireAdmin(); await connectDb();
  const id = objectId.safeParse((await params).id); if (!id.success) notFound();
  const m = await TeamMember.findById(id.data).lean(); if (!m) notFound();
  return <><Head title={m.fullName} /><Flash sp={await searchParams} />
    <div className="member-danger-action"><Confirm label="Delete team member" danger><form action={deleteTeamMemberAction.bind(null, id.data)}><p>This removes the team member from the roster.</p><SubmitButton className="btn danger">Confirm delete</SubmitButton></form></Confirm></div>
    <TeamForm action={updateTeamAction.bind(null, id.data)} m={m as never} services={await Service.find().sort({ name: 1 }).lean()} showAck />
    <section className="card"><h2>Time off & blocked periods</h2>
      <ul>{m.unavailablePeriods.length === 0 && <li className="muted">None.</li>}{m.unavailablePeriods.map((p) => <li key={String(p._id)}>{fmt(p.start, m.timeZone)} – {fmt(p.end, m.timeZone)} · {p.reason}
        <form action={removeTimeOffAction.bind(null, id.data, String(p._id))} style={{ display: "inline", marginLeft: ".5rem" }}><SubmitButton className="btn sm out">Remove</SubmitButton></form></li>)}</ul>
      <form action={addTimeOffAction.bind(null, id.data)} className="row"><div><label htmlFor="fd">From</label><input id="fd" type="date" name="fromDate" required /></div><div><label htmlFor="ft">Time</label><input id="ft" type="time" name="fromTime" /></div>
        <div><label htmlFor="td">To</label><input id="td" type="date" name="toDate" required /></div><div><label htmlFor="tt">Time</label><input id="tt" type="time" name="toTime" /></div>
        <div><label htmlFor="rs">Reason</label><input id="rs" name="reason" required maxLength={200} /></div>
        <label className="fit" style={{ fontWeight: 400 }}><input type="checkbox" name="ack" style={{ width: "auto" }} /> acknowledge affected jobs</label><SubmitButton className="btn fit">Add</SubmitButton></form>
      <p className="muted">Empty times mean whole days (00:00–23:59). Past jobs are unaffected; future jobs hit by new time off must be resolved or acknowledged.</p></section></>;
}
