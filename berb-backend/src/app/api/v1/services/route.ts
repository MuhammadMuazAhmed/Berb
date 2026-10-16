import { corsHeaders, json, preflight, route } from "@/lib/http";
import { publicServices } from "@/services/catalog.service";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;
// Public, non-sensitive catalogue. Bare array keeps compatibility with the React client (fetchServices()).
export const GET = route(async (req) =>
  json(await publicServices(), 200, { ...corsHeaders(req), "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }));
