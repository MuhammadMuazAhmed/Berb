import "server-only";
import { NextResponse } from "next/server";
import { AppError, badRequest, toResponseBody } from "./errors";
import { getEnv } from "./env";
import { connectDb } from "./db";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;
export type Ctx = { params: Promise<Record<string, string>> };
type RouteOptions = { corsOnError?: boolean };

/** Wraps a route handler: DB connection + uniform error mapping. */
export function route<C = Ctx>(fn: Handler<C>, options: RouteOptions = {}): Handler<C> {
  return async (req, ctx) => {
    try { await connectDb(); return await fn(req, ctx); }
    catch (e) {
      const { status, body } = toResponseBody(e);
      const cors = options.corsOnError ? corsHeaders(req) : {};
      return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...cors } });
    }
  };
}
export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function readJson(req: Request, maxBytes = 20_000): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) throw new AppError(413, "Payload too large", "payload_too_large");
  try { return JSON.parse(text || "{}"); } catch { throw badRequest("Malformed JSON body"); }
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** CORS for the PUBLIC endpoints only; never credentialed, only listed origins. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = getEnv().ALLOWED_ORIGINS;
  if (!origin || !allowed.includes(origin)) return { Vary: "Origin" };
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" };
}
export const preflight = (req: Request) => new NextResponse(null, { status: 204, headers: corsHeaders(req) });
