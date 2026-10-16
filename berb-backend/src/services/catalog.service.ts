import "server-only";
import { Service, ServiceRequest } from "@/models";
import { conflict, notFound } from "@/lib/errors";
import type { ServiceInput } from "@/schemas";

export const publicServices = async () =>
  (await Service.find({ active: true }).sort({ name: 1 }).lean()).map((s) => ({
    id: String(s._id), slug: s.slug, name: s.name, description: s.description, category: s.category,
    defaultDurationMinutes: s.defaultDurationMinutes, ...(s.startingPrice != null && { startingPrice: s.startingPrice }),
  }));

const dup = (e: unknown) => (e as { code?: number }).code === 11000;
export async function createService(i: ServiceInput) {
  try { return await Service.create(i); } catch (e) { if (dup(e)) throw conflict("Slug already in use"); throw e; }
}
export async function updateService(id: string, i: Partial<ServiceInput>) {
  try {
    const s = await Service.findByIdAndUpdate(id, { $set: i }, { new: true, runValidators: true });
    if (!s) throw notFound("Service not found");
    return s;
  } catch (e) { if (dup(e)) throw conflict("Slug already in use"); throw e; }
}
export const requestCountByService = (id: string) => ServiceRequest.countDocuments({ serviceId: id });
