import { requireAdmin } from "@/lib/auth/session";
import { json, readJson, route, type Ctx } from "@/lib/http";
import { objectId, serviceUpdateSchema } from "@/schemas";
import { updateService } from "@/services/catalog.service";

export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireAdmin({ req, write: true });
  return json(await updateService(objectId.parse((await params).id), serviceUpdateSchema.parse(await readJson(req))));
});
