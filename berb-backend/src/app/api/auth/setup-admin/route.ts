import { forbidden } from "@/lib/errors";
import { clientIp, json, readJson, route } from "@/lib/http";
import { getEnv } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";
import { initialAdminSetupSchema } from "@/schemas";
import { initializeFirstOwner } from "@/services/admin-initialization.service";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(getEnv().APP_URL).origin) throw forbidden("Setup is unavailable or the submitted details are invalid");
  await rateLimit(`admin-setup:${clientIp(req)}`, 5, 3600);
  const input = initialAdminSetupSchema.parse(await readJson(req, 4000));
  await initializeFirstOwner(input);
  return json({ ok: true }, 201);
});