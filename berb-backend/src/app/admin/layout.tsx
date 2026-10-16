import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getSession(); // server-side check on EVERY render (middleware is not relied upon)
  if (!me) redirect("/admin-login");
  return <AdminShell name={me.name} role={me.role}>{children}</AdminShell>;
}
