import { DAYS } from "@/lib/format";
import type { DayHours } from "@/lib/scheduling/engine";
import { defaultSchedule } from "@/schemas";
import { SubmitButton } from "@/components/SubmitButton";

function FieldIcon({ name }: { name: "person" | "email" | "phone" | "timezone" | "biography" | "service" | "schedule" }) {
  const paths = {
    person: <><circle cx="10" cy="6.5" r="3" /><path d="M4 17c.5-3 2.5-4.5 6-4.5s5.5 1.5 6 4.5" /></>,
    email: <><rect x="2.5" y="4" width="15" height="12" rx="1.5" /><path d="m3 5 7 5.5L17 5" /></>,
    phone: <path d="M6.1 2.8 3.7 4.1c-.8.5-.6 2 .1 3.6 1.4 3.1 5.5 7.2 8.6 8.6 1.6.7 3.1.9 3.6.1l1.3-2.4-3.7-2.2-1.5 1.5a14 14 0 0 1-5.3-5.3l1.5-1.5-2.2-3.7Z" />,
    timezone: <><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3a11 11 0 0 1 0 14M10 3a11 11 0 0 0 0 14" /></>,
    biography: <><path d="M5 3.5h7l3 3V17H5z" /><path d="M12 3.5V7h3M7.5 10h5M7.5 13h5" /></>,
    service: <><path d="M7 7V5.5A1.5 1.5 0 0 1 8.5 4h3A1.5 1.5 0 0 1 13 5.5V7M3.5 7h13v9h-13z" /><path d="M3.5 10.5h13M8 10v2h4v-2" /></>,
    schedule: <><rect x="3" y="4.5" width="14" height="12" rx="1.5" /><path d="M6.5 3v3M13.5 3v3M3 8h14M6.5 11h2M11.5 11h2M6.5 14h2" /></>,
  };
  return <svg className="team-field-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

type M = { fullName?: string; email?: string; phone?: string; biography?: string; timeZone?: string; active?: boolean; serviceIds?: unknown[]; workingSchedule?: DayHours[] };
export function TeamForm({ action, m = {}, services, showAck }: { action: (f: FormData) => Promise<void>; m?: M; services: { _id: unknown; name: string }[]; showAck?: boolean }) {
  const sched = (m.workingSchedule ?? defaultSchedule) as DayHours[];
  const sel = new Set((m.serviceIds ?? []).map(String));
  return <form action={action} className="card team-form">
    <div className="row"><div className="field"><label className="team-field-label" htmlFor="fullName"><FieldIcon name="person" />Full name</label><input id="fullName" name="fullName" required defaultValue={m.fullName} /></div>
      <div className="field"><label className="team-field-label" htmlFor="email"><FieldIcon name="email" />Email</label><input id="email" name="email" type="email" required defaultValue={m.email} /></div>
      <div className="field"><label className="team-field-label" htmlFor="phone"><FieldIcon name="phone" />Phone</label><input id="phone" name="phone" required defaultValue={m.phone} /></div>
      <div className="field"><label className="team-field-label" htmlFor="timeZone"><FieldIcon name="timezone" />Time zone (IANA)</label><input id="timeZone" name="timeZone" defaultValue={m.timeZone ?? "Asia/Karachi"} /></div></div>
    <div className="field"><label className="team-field-label" htmlFor="biography"><FieldIcon name="biography" />Biography (internal)</label><textarea id="biography" name="biography" rows={2} defaultValue={m.biography} /></div>
    <fieldset className="field"><legend><span className="team-field-label"><FieldIcon name="service" />Qualified services</span></legend>{services.length === 0 && <span className="muted">Create services first.</span>}
      {services.map((s) => <label key={String(s._id)} style={{ fontWeight: 400 }}><input type="checkbox" name="serviceIds" value={String(s._id)} defaultChecked={sel.has(String(s._id))} style={{ width: "auto", marginRight: ".4rem" }} />{s.name}</label>)}</fieldset>
    <fieldset className="field scroll"><legend><span className="team-field-label"><FieldIcon name="schedule" />Weekly hours</span> (member's time zone)</legend><table className="schedule-table"><thead><tr><th>Day</th><th>Works</th><th>From</th><th>To</th><th>Break from</th><th>Break to</th></tr></thead><tbody>
      {[1, 2, 3, 4, 5, 6, 0].map((d) => { const x = sched.find((s) => s.day === d); return <tr key={d}><td>{DAYS[d]}</td>
        <td><input aria-label={`${DAYS[d]} works`} type="checkbox" name={`w${d}`} defaultChecked={!!x} style={{ width: "auto" }} /></td>
        <td><input aria-label={`${DAYS[d]} start`} type="time" name={`s${d}`} defaultValue={x?.intervals[0]?.start ?? "08:00"} /></td><td><input aria-label={`${DAYS[d]} end`} type="time" name={`e${d}`} defaultValue={x?.intervals[0]?.end ?? "17:00"} /></td>
        <td><input aria-label={`${DAYS[d]} break start`} type="time" name={`bs${d}`} defaultValue={x?.breaks[0]?.start ?? ""} /></td><td><input aria-label={`${DAYS[d]} break end`} type="time" name={`be${d}`} defaultValue={x?.breaks[0]?.end ?? ""} /></td></tr>; })}</tbody></table>
      <p className="muted">One working interval and one break per day in this form; the API supports several.</p></fieldset>
    <label style={{ fontWeight: 400 }}><input type="checkbox" name="active" defaultChecked={m.active ?? true} style={{ width: "auto", marginRight: ".4rem" }} />Active</label>
    {showAck && <label style={{ fontWeight: 400 }}><input type="checkbox" name="ack" style={{ width: "auto", marginRight: ".4rem" }} />I understand this may affect already assigned jobs (only needed if the save is rejected with a job list)</label>}
    <SubmitButton style={{ marginTop: "1rem" }}>Save</SubmitButton></form>;
}
