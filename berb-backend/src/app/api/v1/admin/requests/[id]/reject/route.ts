import { requireAdmin } from "@/lib/auth/session";
import { json, readJson, route, type Ctx } from "@/lib/http";
import { objectId, rejectSchema } from "@/schemas";
import { rejectRequest } from "@/services/assignment.service";

export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin({ req, write: true });
  const id = objectId.parse((await params).id);
  const body = rejectSchema.parse(await readJson(req));
  return json(await rejectRequest(id, body.reason, admin.id));
});
