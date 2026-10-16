import { clientIp, json, readJson, route } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { unauthorized } from "@/lib/errors";
import { loginSchema } from "@/schemas";
import { startSession, verifyLogin } from "@/lib/auth/session";

export const POST = route(async (req) => {
  const body = loginSchema.parse(await readJson(req, 2000));
  await rateLimit(`login-ip:${clientIp(req)}`, 20, 900);
  await rateLimit(`login:${body.email}`, 8, 900);
  const s = await verifyLogin(body.email, body.password);
  if (!s) throw unauthorized("Invalid email or password");
  await startSession(s);
  return json({ ok: true, user: { name: s.name, role: s.role } });
});
