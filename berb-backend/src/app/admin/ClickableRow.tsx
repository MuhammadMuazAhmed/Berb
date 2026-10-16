"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();

  const navigate = (event: MouseEvent<HTMLTableRowElement>) => {
    if (!(event.target instanceof Element) || event.target.closest("a, button, input, select, textarea, form, summary, details")) return;
    router.push(href);
  };

  return <tr className="clickable-row" onClick={navigate}>{children}</tr>;
}