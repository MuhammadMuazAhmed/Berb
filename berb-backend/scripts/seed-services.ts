/** Seeds the three initial services as DATA (admins can add/edit more in the dashboard). Idempotent. */
import "./_bootstrap";
const main = async () => {
  const { connectDb } = await import("../src/lib/db");
  const { Service } = await import("../src/models");
  await connectDb();
  const seed = [
    { name: "Sanitary & plumbing", slug: "sanitary", category: "sanitary", description: "Bathrooms, sanitary installations and pipe repairs.", defaultDurationMinutes: 120, bufferMinutes: 30 },
    { name: "Heating", slug: "heating", category: "heating", description: "Heating installation, maintenance and repair.", defaultDurationMinutes: 120, bufferMinutes: 30 },
    { name: "Solar", slug: "solar", category: "solar", description: "Solar and photovoltaic systems.", defaultDurationMinutes: 180, bufferMinutes: 30 },
  ];
  for (const s of seed) await Service.updateOne({ slug: s.slug }, { $setOnInsert: { ...s, active: true } }, { upsert: true });
  console.log("Services seeded."); process.exit(0);
};
main().catch((e) => { console.error(e); process.exit(1); });
