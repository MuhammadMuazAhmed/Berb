import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getEnv } from "../env";
import { connectDb } from "../db";
import { AdminUser } from "@/models";
import { forbidden, unauthorized } from "../errors";

const COOKIE = "berb_admin";
const MAX_AGE = 60 * 60 * 8;
const key = () => new TextEncoder().encode(getEnv().AUTH_SECRET);

export type AdminRole = "owner" | "admin" | "viewer";
export interface AdminSession { id: string; name: string; email: string; role: AdminRole }

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
// Constant-ish time compare even when the user doesn't exist (avoids user enumeration by timing)
const DUMMY = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO5uPz1y1pNn2yv5v1v1v1v1v1v1v1v1v";
export async function verifyLogin(email: string, password: string): Promise<AdminSession | null> {
  await connectDb();
  const u = await AdminUser.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, u?.passwordHash ?? DUMMY);
  if (!u || !ok || !u.active) return null;
  return { id: String(u._id), name: u.name, email: u.email, role: u.role as AdminRole };
}

export async function startSession(s: AdminSession) {
  const token = await new SignJWT({ role: s.role }).setProtectedHeader({ alg: "HS256" }).setSubject(s.id)
    .setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: getEnv().NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: MAX_AGE });
}
export async function endSession() { (await cookies()).delete(COOKIE); }

/** Verifies the cookie AND re-checks the admin in the DB (deactivation / role change take effect immediately). */
export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    await connectDb();
    const u = await AdminUser.findById(payload.sub);
    if (!u || !u.active) return null;
    return { id: String(u._id), name: u.name, email: u.email, role: u.role as AdminRole };
  } catch { return null; }
}

/** Use at the top of every private page, route handler and server action. */
export async function requireAdmin(opts: { write?: boolean; req?: Request } = {}): Promise<AdminSession> {
  const s = await getSession();
  if (!s) throw unauthorized();
  if (opts.write && s.role === "viewer") throw forbidden("Your role cannot modify data");
  const req = opts.req;
  if (req && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    // CSRF defence in depth on top of SameSite=Strict: Origin must match the app.
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(getEnv().APP_URL).host) throw forbidden("Cross-origin request blocked");
  }
  return s;
}

export async function requireOwner(opts: { req?: Request } = {}): Promise<AdminSession> {
  const s = await requireAdmin(opts);
  if (s.role !== "owner") throw forbidden("Owner permission required");
  return s;
}
