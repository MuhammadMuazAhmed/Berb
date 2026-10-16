import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { json, route } from "@/lib/http";
import { Notification } from "@/models";

export const GET = route(async (req) => {
  await requireAdmin({ req });
  const q = z.object({ status: z.enum(["pending", "processing", "sent", "failed"]).optional(), page: z.coerce.number().int().min(1).default(1) }).parse(Object.fromEntries(new URL(req.url).searchParams));
  const f = q.status ? { status: q.status } : {};
  const [items, total] = await Promise.all([
    Notification.find(f).select("-payload").sort({ createdAt: -1 }).skip((q.page - 1) * 25).limit(25).populate("serviceRequestId", "reference").lean(), Notification.countDocuments(f)]);
  return json({ items, total, page: q.page });
});
