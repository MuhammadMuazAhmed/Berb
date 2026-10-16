import type { ReactNode } from "react";
import Link from "next/link";

export const Badge = ({ s }: { s: string }) => <span className={`badge b-${s}`}>{s.replace("_", " ")}</span>;
export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const e = typeof sp.error === "string" ? sp.error : undefined, o = typeof sp.ok === "string" ? sp.ok : undefined;
  return <>{e && <div className="alert err" role="alert">{e}</div>}{o && <div className="alert ok" role="status">{o}</div>}</>;
}
export const Head = ({ title, children }: { title: string; children?: ReactNode }) => <div className="head"><h1>{title}</h1><div>{children}</div></div>;
export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;
/** JS-free confirmation dialog: the destructive submit is only reachable after expanding. */
export function Confirm({ label, danger, children }: { label: string; danger?: boolean; children: ReactNode }) {
  return <details style={{ display: "inline-block", marginRight: ".5rem" }}><summary className={`btn sm ${danger ? "danger" : "out"}`} style={{ listStyle: "none" }}>{label}</summary>
    <div className="card" role="group" aria-label={`Confirm ${label}`} style={{ marginTop: ".5rem", maxWidth: 360 }}>{children}</div></details>;
}
export function Pager({ base, page, pages }: { base: string; page: number; pages: number }) {
  const l = (p: number) => `${base}${base.includes("?") ? "&" : "?"}page=${p}`;
  return <div className="row" style={{ marginTop: ".75rem" }}><span className="muted fit">Page {page} / {pages}</span>
    {page > 1 && <Link className="btn sm out fit" href={l(page - 1)}>Previous</Link>}{page < pages && <Link className="btn sm out fit" href={l(page + 1)}>Next</Link>}</div>;
}
