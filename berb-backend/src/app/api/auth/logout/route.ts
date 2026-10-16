import { endSession } from "@/lib/auth/session";
import { json, route } from "@/lib/http";
export const POST = route(async () => { await endSession(); return json({ ok: true }); });
