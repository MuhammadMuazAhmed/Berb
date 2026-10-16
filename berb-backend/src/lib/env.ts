import "server-only";
import { z } from "zod";

export const envSchema = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),
  MONGODB_DB_NAME: z.string().min(1).default("berb"),
  APP_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  ADMIN_SETUP_SECRET: z.string().min(43, "ADMIN_SETUP_SECRET must be at least 32 random bytes").optional(),
  ALLOWED_ORIGINS: z.string().default("").transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
  BUSINESS_TIME_ZONE: z.string().default("Asia/Karachi"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(3).default("BERB <onboarding@resend.dev>"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
}).superRefine((v, ctx) => {
  if (v.NODE_ENV === "production" && !v.RESEND_API_KEY)
    ctx.addIssue({ code: "custom", path: ["RESEND_API_KEY"], message: "RESEND_API_KEY is required in production" });
  if (v.NODE_ENV === "production" && !v.ADMIN_SETUP_SECRET)
    ctx.addIssue({ code: "custom", path: ["ADMIN_SETUP_SECRET"], message: "ADMIN_SETUP_SECRET is required in production" });
});

export type Env = z.output<typeof envSchema>;
let cached: Env | undefined;

/** Lazily validated so `next build` doesn't need secrets. Throws a readable message. */
export function getEnv(): Env {
  if (cached) return cached;
  const r = envSchema.safeParse(process.env);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${msg}`);
  }
  return (cached = r.data);
}
