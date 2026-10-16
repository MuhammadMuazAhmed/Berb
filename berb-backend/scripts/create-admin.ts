/**
 * Creates the first administrator. CLI only (no HTTP surface).
 *   ADMIN_NAME="Jane" ADMIN_EMAIL=jane@x.com ADMIN_PASSWORD='...' npm run admin:create
 * Refuses to run if an admin already exists unless --force is passed. In production also require ALLOW_ADMIN_SEED=true.
 */
import "./_bootstrap";
const main = async () => {
  const { connectDb } = await import("../src/lib/db");
  const { AdminUser } = await import("../src/models");
  const { adminCreateSchema } = await import("../src/schemas");
  const { hashPassword } = await import("../src/lib/auth/session");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_SEED !== "true") throw new Error("Set ALLOW_ADMIN_SEED=true to run this in production");
  const input = adminCreateSchema.parse({ name: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  await connectDb();
  if ((await AdminUser.countDocuments()) > 0 && !process.argv.includes("--force")) throw new Error("An admin already exists. Use --force to add another.");
  await AdminUser.create({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password), role: "admin" });
  console.log(`Admin ${input.email} created.`);
  process.exit(0);
};
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
