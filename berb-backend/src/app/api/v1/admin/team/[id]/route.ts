import { requireAdmin } from "@/lib/auth/session";
import { notFound } from "@/lib/errors";
import { json, readJson, route, type Ctx } from "@/lib/http";
import { TeamMember } from "@/models";
import { objectId, teamUpdateSchema } from "@/schemas";
import { updateMember } from "@/services/team.service";

export const GET = route<Ctx>(async (req, { params }) => {
  await requireAdmin({ req });
  const m = await TeamMember.findById(objectId.parse((await params).id)).lean();
  if (!m) throw notFound("Team member not found");
  return json(m);
});
export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireAdmin({ req, write: true });
  return json(await updateMember(objectId.parse((await params).id), teamUpdateSchema.parse(await readJson(req, 50_000))));
});
