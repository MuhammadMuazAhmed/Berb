import { requireAdmin } from "@/lib/auth/session";
import { json, route } from "@/lib/http";
import { requestFilterSchema } from "@/schemas";
import { listRequests } from "@/services/request.service";

export const GET = route(async (req) => {
  await requireAdmin({ req });
  const f = requestFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return json(await listRequests(f));
});
