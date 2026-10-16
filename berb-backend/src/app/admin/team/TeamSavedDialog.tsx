"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function TeamSavedDialog({ saved }: { saved?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(saved));

  useEffect(() => {
    if (!saved) return;
    const timeout = window.setTimeout(() => {
      setOpen(false);
      router.replace("/admin/team", { scroll: false });
    }, 1800);
    return () => window.clearTimeout(timeout);
  }, [saved, router]);

  if (!open || !saved) return null;
  const created = saved === "created";
  return <div className="team-success-backdrop">
    <section className="team-success-dialog" role="dialog" aria-modal="true" aria-labelledby="team-success-title">
      <span className="team-success-check" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><circle className="team-success-ring" cx="24" cy="24" r="21" /><path className="team-success-tick" d="m14 24 7 7 14-15" /></svg></span>
      <h2 id="team-success-title">Team member {created ? "created" : "updated"}</h2>
      <p>{created ? "The new team member is on your roster." : "Your changes have been saved."}</p>
    </section>
  </div>;
}