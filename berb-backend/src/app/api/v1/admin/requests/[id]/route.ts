import { requireAdmin } from "@/lib/auth/session";
import { json, readJson, route, type Ctx } from "@/lib/http";
import { notesSchema, objectId } from "@/schemas";
import { setNotes } from "@/services/assignment.service";
import { getRequest } from "@/services/request.service";

export const GET = route<Ctx>(async (req, { params }) => { await requireAdmin({ req }); return json(await getRequest(objectId.parse((await params).id))); });
export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireAdmin({ req, write: true });
  return json(await setNotes(objectId.parse((await params).id), notesSchema.parse(await readJson(req)).adminNotes));
});
