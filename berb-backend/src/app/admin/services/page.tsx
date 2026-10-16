import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Service, ServiceRequest } from "@/models";
import { Flash, Head } from "@/components/ui";
import Link from "next/link";
import { ServiceEditor } from "./ServiceEditor";

type S = { _id?: unknown; name?: string; slug?: string; category?: string; description?: string; defaultDurationMinutes?: number; bufferMinutes?: number; startingPrice?: number | null; active?: boolean };

const money = (v?: number | null) => (typeof v === "number" && Number.isFinite(v) ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(v) : "—");

export default async function Services({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  await connectDb();
  const sp = await searchParams;
  const [services, counts] = await Promise.all([
    Service.find().sort({ name: 1 }).lean(),
    ServiceRequest.aggregate([{ $group: { _id: "$serviceId", n: { $sum: 1 } } }]),
  ]);
  const n = new Map(counts.map((c: { _id: unknown; n: number }) => [String(c._id), c.n]));
  const modal = typeof sp.modal === "string" ? sp.modal : undefined;
  const editId = typeof sp.edit === "string" ? sp.edit : undefined;
  const editingService = editId ? services.find((s) => String(s._id) === editId) ?? null : null;

  return (
    <>
      <Head title="Services" />
      <Flash sp={sp} />

      <div className="page-intro">
        <p className="muted">Manage service offerings, pricing, scheduling duration, and availability.</p>
        <Link href="/admin/services?modal=add" className="btn">Add service</Link>
      </div>

      {modal === "add" && <ServiceEditor mode="add" />}
      {modal === "edit" && editingService && <ServiceEditor service={editingService as NonNullable<Parameters<typeof ServiceEditor>[0]["service"]>} mode="edit" />}

      {services.length === 0 ? (
        <section className="card" style={{ padding: "2rem 1.25rem" }}>
          <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
            <h3 style={{ margin: 0 }}>No services yet</h3>
            <p style={{ margin: 0, color: "#4b5563" }}>Create your first service offering to start accepting requests.</p>
            <Link href="/admin/services?modal=add" className="btn">Add Service</Link>
          </div>
        </section>
      ) : (
        <section className="card service-table-card">
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Service name</th><th>Category</th><th>Duration</th><th>Buffer</th><th>Starting price</th><th>Requests</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={String(s._id)} style={{ borderTop: "1px solid #eaedf2" }}>
                    <td>
                      <div className="service-name">{s.name}</div>
                      <div className="muted service-slug">{s.slug}</div>
                    </td>
                    <td>{s.category}</td>
                    <td>{s.defaultDurationMinutes ?? 0} min</td>
                    <td>{s.bufferMinutes ?? 0} min</td>
                    <td>{money(s.startingPrice ?? undefined)}</td>
                    <td>
                      <Link href={`/admin/requests?serviceId=${String(s._id)}`}>
                        {n.get(String(s._id)) ?? 0}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${s.active ? "b-completed" : "b-cancelled"}`}>
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Link href={`/admin/services?modal=edit&edit=${String(s._id)}`} className="btn sm out">Edit</Link>
                        <Link href={`/admin/requests?serviceId=${String(s._id)}`} className="btn sm">View requests</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}


