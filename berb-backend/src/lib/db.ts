import "server-only";
import mongoose from "mongoose";
import { getEnv } from "./env";

const g = globalThis as unknown as { _mongoose?: { conn?: typeof mongoose; promise?: Promise<typeof mongoose> } };
const cache = (g._mongoose ??= {});

/** Cached connection: survives dev hot-reloads and is reused across requests. */
export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  const env = getEnv();
  cache.promise ??= mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME, maxPoolSize: 10, serverSelectionTimeoutMS: 8000, autoIndex: env.NODE_ENV !== "production",
  });
  try { cache.conn = await cache.promise; } catch (e) { cache.promise = undefined; throw e; }
  return cache.conn;
}
