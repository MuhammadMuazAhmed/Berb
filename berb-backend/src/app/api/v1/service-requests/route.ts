import { AppError } from "@/lib/errors";
import { clientIp, corsHeaders, json, preflight, readJson, route } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { publicRequestSchema } from "@/schemas";
import { createPublicRequest } from "@/services/request.service";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export const POST = route(async (req) => {
  const cors = corsHeaders(req);
  await rateLimit(`submit:${clientIp(req)}`, 5, 3600); // 5 submissions / hour / IP
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) throw new AppError(415, "Content-Type must be application/json", "unsupported_media_type");
  const input = publicRequestSchema.parse(await readJson(req, 20_000));
  // Honeypot: pretend success, store nothing.
  if (input.website) return json({ id: "BERB-IGNORED", reference: "BERB-IGNORED", status: "pending" }, 201, cors);
  const r = await createPublicRequest(input);
  // `id` mirrors `reference` (the React client reads `id`). Mongo ids are never exposed.
  return json({ id: r.reference, reference: r.reference, status: r.status }, r.duplicate ? 200 : 201, cors);
}, { corsOnError: true });
