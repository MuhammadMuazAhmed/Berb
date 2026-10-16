import Link from "next/link";
import { isAdminSetupAvailable } from "@/services/admin-initialization.service";
import { SetupAdminForm } from "./SetupAdminForm";

export const dynamic = "force-dynamic";

export default async function SetupAdminPage() {
  let available = false;
  try { available = await isAdminSetupAvailable(); } catch { available = false; }

  if (available) return <SetupAdminForm />;
  return <main className="login"><div className="login-brand"><span className="brand-mark" aria-hidden="true"><i /><i /></span>BERB</div>
    <section className="card"><h1>Setup unavailable</h1><p className="login-subtitle">Initial administrator setup is unavailable or has already been completed.</p>
      <Link className="btn" href="/admin/login">Admin sign in</Link></section></main>;
}