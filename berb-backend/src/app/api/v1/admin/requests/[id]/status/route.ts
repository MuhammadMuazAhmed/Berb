import { requireAdmin } from "@/lib/auth/session";
import { json, readJson, route, type Ctx } from "@/lib/http";
import { objectId, statusSchema } from "@/schemas";
import { setProgress } from "@/services/assignment.service";

export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin({ req, write: true });
  const id = objectId.parse((await params).id);
  const body = statusSchema.parse(await readJson(req));
  return json(await setProgress(id, body.status, admin.id));
});
