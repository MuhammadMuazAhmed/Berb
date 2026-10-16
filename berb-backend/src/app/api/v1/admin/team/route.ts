import { requireAdmin } from "@/lib/auth/session";
import { json, readJson, route } from "@/lib/http";
import { TeamMember } from "@/models";
import { teamCreateSchema } from "@/schemas";
import { createMember } from "@/services/team.service";

export const GET = route(async (req) => { await requireAdmin({ req }); return json(await TeamMember.find().sort({ fullName: 1 }).lean()); });
export const POST = route(async (req) => {
  await requireAdmin({ req, write: true });
  return json(await createMember(teamCreateSchema.parse(await readJson(req, 50_000))), 201);
});
