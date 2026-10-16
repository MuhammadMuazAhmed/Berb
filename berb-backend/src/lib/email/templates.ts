const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface JobEmailData {
  type: "job_assigned" | "job_rescheduled" | "job_cancelled"; memberName: string; reference: string; service: string;
  whenLabel: string; customerName: string; customerEmail: string; customerPhone?: string; address: string; description: string; link: string; note?: string;
}
const HEAD = { job_assigned: "New job assigned", job_rescheduled: "Job rescheduled", job_cancelled: "Job cancelled" } as const;

/** Brand: dark #161723, grey #c6c6c7, STIX Two Text headings (Georgia fallback), Ubuntu body (system fallback). */
export function jobEmail(d: JobEmailData) {
  const title = `${HEAD[d.type]} · ${d.reference}`;
  const rows: [string, string][] = d.type === "job_cancelled"
    ? [["Service", d.service], ["Was scheduled", d.whenLabel], ["Customer", d.customerName]]
    : [["Service", d.service], ["When", d.whenLabel], ["Customer", `${d.customerName} — ${d.customerEmail}${d.customerPhone ? ` — ${d.customerPhone}` : ""}`],
       ["Address", d.address], ["Work to do", d.description]];
  if (d.note) rows.push(["Note", d.note]);
  const html = `<div style="background:#f3f3f4;padding:24px;font-family:Ubuntu,Segoe UI,Arial,sans-serif;color:#161723">
<div style="max-width:560px;margin:auto;background:#fff;border:1px solid #c6c6c7;border-radius:4px">
<div style="background:#161723;color:#fff;padding:20px 24px;font:600 22px 'STIX Two Text',Georgia,serif">BERB</div>
<div style="padding:24px"><h1 style="font:600 24px 'STIX Two Text',Georgia,serif;margin:0 0 12px">${esc(HEAD[d.type])}</h1>
<p>Hello ${esc(d.memberName)},</p>
<table style="width:100%;border-collapse:collapse;font-size:15px">${rows.map(([k, v]) => `<tr><td style="padding:8px 0;border-top:1px solid #e3e3e4;color:#4d4e5c;width:110px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-top:1px solid #e3e3e4;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}</table>
<p style="margin:24px 0 0"><a href="${esc(d.link)}" style="background:#161723;color:#fff;padding:12px 20px;border-radius:4px;text-decoration:none;display:inline-block">Open in dashboard (login required)</a></p>
<p style="color:#4d4e5c;font-size:13px">Reference ${esc(d.reference)}</p></div></div></div>`;
  const text = `${title}\n\nHello ${d.memberName},\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nDashboard (login required): ${d.link}`;
  return { subject: title, html, text };
}
