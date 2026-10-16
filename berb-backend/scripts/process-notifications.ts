/** Drains due notifications once (use from a system cron / worker): npm run notifications:process */
import "./_bootstrap";
const main = async () => {
  const { connectDb } = await import("../src/lib/db");
  const { processDueNotifications } = await import("../src/services/notification.service");
  await connectDb(); console.log("processed", await processDueNotifications(100)); process.exit(0);
};
main().catch((e) => { console.error(e); process.exit(1); });
