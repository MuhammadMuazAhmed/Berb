import "server-only";
import { RateLimit } from "@/models";
import { tooMany } from "./errors";

/** Fixed-window limiter stored in MongoDB (shared by all instances; TTL index cleans up). */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const now = new Date();
  const doc = await RateLimit.findOneAndUpdate(
    { key, expiresAt: { $gt: now } }, { $inc: { count: 1 } }, { new: true },
  );
  if (doc) { if (doc.count > limit) throw tooMany(); return; }
  try { await RateLimit.findOneAndReplace({ key }, { key, count: 1, expiresAt: new Date(now.getTime() + windowSec * 1000) }, { upsert: true }); }
  catch (e) { if ((e as { code?: number }).code !== 11000) throw e; }
}
