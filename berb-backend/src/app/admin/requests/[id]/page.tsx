import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { localYmd } from "@/lib/scheduling/engine";
import { objectId } from "@/schemas";
import { availabilityFor } from "@/services/availability.service";
import { getRequest } from "@/services/request.service";
import { Badge, Confirm, Flash, Head } from "@/components/ui";
import { fmt, fmtTime, one } from "@/lib/format";
import { assignAction, cancelAction, notesAction, progressAction, rejectAction, rescheduleAction } from "../../../actions/admin";
import { SubmitButton } from "@/components/SubmitButton";
import { ArrowLeft, ChevronDown } from "lucide-react";

type Avail = Awaited<ReturnType<typeof availabilityFor>>;
export default async function RequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin(); await connectDb();
  const { id: raw } = await params, sp = await searchParams;
  const id = objectId.safeParse(raw); if (!id.success) notFound();
  const r = (await getRequest(id.data)) as any;
  const tz = getEnv().BUSINESS_TIME_ZONE;
  const fixedTime = Boolean(r.requestedStart && !r.scheduledStart);
  const queryDate = one(sp.date);
  const date = !fixedTime && /^\d{4}-\d{2}-\d{2}$/.test(queryDate ?? "") ? queryDate! : localYmd(r.scheduledStart ?? r.requestedStart ?? new Date(), tz);
  const open = r.status === "pending" || r.status === "assigned";
  const av: Avail | null = open ? await availabilityFor({ requestId: id.data, date, ...(fixedTime ? { start: r.requestedStart } : {}) }) : null;
  const candidates = av ? (fixedTime ? av.members.filter((m) => m.proposed?.ok) : av.members) : [];
  const act = r.status === "pending" ? assignAction.bind(null, id.data) : rescheduleAction.bind(null, id.data);
  const a = r.address;
  return <><Head title={`Request ${r.reference}`}><Link className="btn sm out" href="/admin/requests"><ArrowLeft size={15} aria-hidden="true" />All requests</Link><Badge s={r.status} /></Head><Flash sp={sp} />
    <div className="request-detail-grid">
      <section className="card request-information">
        <div className="request-service-highlight"><span className="muted">Requested service</span><strong>{r.serviceId?.name ?? "Service unavailable"}</strong></div>
        <h2>Customer & request</h2>
        <dl className="request-facts">
          {([ ["Customer", r.customerName], ["Email", r.customerEmail], ["Phone", r.customerPhone ?? "—"], ["Address", [a.line1, [a.postalCode, a.city].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ")], ["Timing", r.requestedStart ? `Fixed time · ${fmt(r.requestedStart, tz)}` : "Flexible timing"], ["Urgency", r.urgency ?? "Not provided"], ["Type / source", `${r.requestType} / ${r.source}`], ["Submitted", fmt(r.createdAt, tz)], ["Duration", `${r.durationMinutes} min + ${r.bufferMinutes} min buffer`]] as [string, string][])
            .map(([label, value]) => <div className="request-fact" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <h3 className="request-description-title">Work description</h3>
        <p className="request-description">{r.description}</p>
        {r.additionalInfo && <p className="request-additional-info">{r.additionalInfo}</p>}
        {r.rejectionReason && <p className="alert err">Rejected: {r.rejectionReason}</p>}
      </section>
      <aside className="card request-assignment-summary"><h2>Assignment</h2>
        {r.assignedTeamMemberId ? <><p className="request-assignee">{r.assignedTeamMemberId.fullName}</p><p className="muted">{fmt(r.scheduledStart, tz)} – {fmtTime(r.scheduledEnd, tz)}</p></> : <p className="muted">No team member assigned yet.</p>}
        <div className="request-assignment-summary-fact"><span>Status</span><Badge s={r.status} /></div>
        <div className="request-assignment-summary-fact"><span>Scheduling</span><strong>{fixedTime ? "Fixed time" : "Flexible"}</strong></div>
      </aside>
    </div>

    <details className="card request-notes">
      <summary><span><strong>Internal notes</strong><small>Private to your team · {r.assignmentHistory?.length ?? 0} assignment events</small></span><ChevronDown size={19} aria-hidden="true" /></summary>
      <div className="request-notes-content">
        <form action={notesAction.bind(null, id.data)}><label htmlFor="adminNotes">Notes for your team</label><textarea id="adminNotes" name="adminNotes" rows={4} maxLength={2000} defaultValue={r.adminNotes ?? ""} /><SubmitButton className="btn sm" style={{ marginTop: ".6rem" }}>Save notes</SubmitButton></form>
        <div className="request-history"><h3>Assignment history</h3>{r.assignmentHistory?.length ? <ul>{r.assignmentHistory.map((h: any, i: number) => <li key={i}><time>{fmt(h.at, tz)}</time><span>{h.action}{h.start && ` · ${fmt(h.start, tz)}`}{h.note && ` · ${h.note}`}</span></li>)}</ul> : <p className="muted">No assignments yet.</p>}</div>
      </div>
    </details>

    <section className="card request-workflow"><div className="request-workflow-heading"><div><span className="muted">{fixedTime ? "CUSTOMER REQUESTED A SPECIFIC TIME" : "CUSTOMER IS FLEXIBLE"}</span><h2>{r.status === "pending" ? "Assign a team member" : r.status === "assigned" ? "Reschedule or reassign" : "Actions"}</h2></div>
      {fixedTime && <div className="request-fixed-time"><span className="muted">Requested time</span><strong>{fmt(r.requestedStart, tz)}</strong></div>}</div>
      {av && <>
        {!fixedTime && <form method="get" className="request-date-form"><div><label htmlFor="date">Find availability on</label><input id="date" type="date" name="date" defaultValue={date} /></div><button className="btn out">Check date</button></form>}
        {av.members.length === 0 && <div className="alert err">No active team member is qualified for this service. Add the service to a team member first.</div>}
        {fixedTime && av.members.length > 0 && candidates.length === 0 && <div className="alert err">No qualified team member is available at the requested time. Review the customer’s preference before offering another time.</div>}
        {!fixedTime && av.members.length > 0 && candidates.length === 0 && <div className="empty request-empty">No team members are available on this date. Choose another date to check availability.</div>}
        <div className="request-member-list">{candidates.map((m) => <form key={m.teamMemberId} action={act} className="request-member">
          <input type="hidden" name="teamMemberId" value={m.teamMemberId} /><input type="hidden" name="date" value={date} />
          {fixedTime && <input type="hidden" name="start" value={r.requestedStart.toISOString()} />}
          <div className="request-member-heading"><div><h3>{m.fullName}</h3><span className="muted">{m.timeZone} · {av.durationMinutes} min</span></div><span className="availability-pill">{fixedTime ? "Available at requested time" : `${m.suggestedSlots.length} open times`}</span></div>
          {!fixedTime && <div className="request-slot-picker"><label htmlFor={`slot-${m.teamMemberId}`}>Choose a start time</label><select id={`slot-${m.teamMemberId}`} name="start" required defaultValue=""><option value="" disabled>Select an available time</option>{m.suggestedSlots.map((slot) => <option key={+slot} value={slot.toISOString()}>{fmtTime(slot, m.timeZone)}</option>)}</select>
            {!m.suggestedSlots.length && <span className="muted">No open times on this date.</span>}</div>}
          <details className="request-availability-details"><summary>View working hours and bookings<ChevronDown size={16} aria-hidden="true" /></summary>
            <div><p><b>Working hours:</b> {m.working.length ? m.working.map((w) => `${fmtTime(w.start, m.timeZone)}–${fmtTime(w.end, m.timeZone)}`).join(", ") : "Not working this day"}</p>
              {m.breaks.length > 0 && <p><b>Breaks:</b> {m.breaks.map((w) => `${fmtTime(w.start, m.timeZone)}–${fmtTime(w.end, m.timeZone)}`).join(", ")}</p>}
              {m.timeOff.map((period, i) => <p key={i}><b>Time off:</b> {fmt(period.start, m.timeZone)} – {fmt(period.end, m.timeZone)}{period.reason && ` · ${period.reason}`}</p>)}
              {m.jobs.map((job: any) => <p key={String(job._id)}><b>{job.reference}:</b> {fmtTime(job.scheduledStart, m.timeZone)}–{fmtTime(job.scheduledEnd, m.timeZone)} <Badge s={job.status} /></p>)}
            </div>
          </details>
          <div className="request-member-footer"><span className="muted">Availability is checked again when you assign.</span><SubmitButton className="btn" disabled={!fixedTime && m.suggestedSlots.length === 0} pendingLabel="Saving assignment...">{r.status === "pending" ? "Assign member" : "Save new assignment"}</SubmitButton></div>
        </form>)}</div>
      </>}
      <div className="request-workflow-actions">
        {r.status === "assigned" && <form action={progressAction.bind(null, id.data, "in_progress")}><SubmitButton className="btn sm">Mark in progress</SubmitButton></form>}
        {r.status === "in_progress" && <form action={progressAction.bind(null, id.data, "completed")}><SubmitButton className="btn sm">Mark completed</SubmitButton></form>}
        {r.status === "pending" && <Confirm label="Reject request" danger><form action={rejectAction.bind(null, id.data)}><label htmlFor="rr">Reason (required)</label><input id="rr" name="reason" required minLength={3} /><SubmitButton className="btn danger sm" style={{ marginTop: ".5rem" }}>Confirm reject</SubmitButton></form></Confirm>}
        {["pending", "assigned", "in_progress"].includes(r.status) && <Confirm label="Cancel" danger><form action={cancelAction.bind(null, id.data)}><p>This releases the team member's time block and notifies them.</p><label htmlFor="cr">Reason</label><input id="cr" name="reason" /><SubmitButton className="btn danger sm" style={{ marginTop: ".5rem" }}>Confirm cancel</SubmitButton></form></Confirm>}
        {["completed", "rejected", "cancelled"].includes(r.status) && <p className="muted">This request is closed; no further actions are possible.</p>}
      </div>
    </section></>;
}
