import { requireAdmin } from "@/lib/auth/session";
import { json, route } from "@/lib/http";
import { availabilityQuerySchema } from "@/schemas";
import { availabilityFor } from "@/services/availability.service";

export const GET = route(async (req) => {
  await requireAdmin({ req });
  return json(await availabilityFor(availabilityQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))));
});
