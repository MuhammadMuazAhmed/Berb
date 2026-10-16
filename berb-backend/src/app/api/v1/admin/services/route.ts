import { requireAdmin } from "@/lib/auth/session";
import { json, readJson, route } from "@/lib/http";
import { Service } from "@/models";
import { serviceCreateSchema } from "@/schemas";
import { createService } from "@/services/catalog.service";

export const GET = route(async (req) => { await requireAdmin({ req }); return json(await Service.find().sort({ name: 1 }).lean()); });
export const POST = route(async (req) => { await requireAdmin({ req, write: true }); return json(await createService(serviceCreateSchema.parse(await readJson(req))), 201); });
