import { requireAdmin } from "@/lib/auth/session";
import { json, route, type Ctx } from "@/lib/http";
import { objectId } from "@/schemas";
import { retryNotification } from "@/services/notification.service";

export const POST = route<Ctx>(async (req, { params }) => {
  await requireAdmin({ req, write: true });
  await retryNotification(objectId.parse((await params).id));
  return json({ ok: true });
});
