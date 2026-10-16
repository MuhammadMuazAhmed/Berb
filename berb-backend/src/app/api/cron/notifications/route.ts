import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";
import { unauthorized } from "@/lib/errors";
import { json, route } from "@/lib/http";
import { processDueNotifications } from "@/services/notification.service";

export const dynamic = "force-dynamic";
function authorized(req: Request) {
  const given = Buffer.from(req.headers.get("authorization") ?? ""), want = Buffer.from(`Bearer ${getEnv().CRON_SECRET}`);
  return given.length === want.length && timingSafeEqual(given, want);
}
const run = route(async (req) => { if (!authorized(req)) throw unauthorized(); return json({ processed: await processDueNotifications(50) }); });
export const GET = run, POST = run;
