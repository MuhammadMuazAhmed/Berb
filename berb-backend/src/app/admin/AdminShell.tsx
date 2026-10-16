"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bell, CalendarDays, ChevronRight, Home, Inbox, LogOut, Menu, Moon, Sun, Users, Wrench, X } from "lucide-react";
import { logoutAction } from "../actions/admin";

const navigation = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/admins", label: "Manage Admins", icon: Users },
];

export function AdminShell({ children, name, role }: { children: ReactNode; name: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const query = useSearchParams().toString();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navigationPending, setNavigationPending] = useState(false);
  const current = navigation.find((item) => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href));
  const title = pathname.includes("/requests/") ? "Request details" : pathname.includes("/team/new") ? "Add team member" : pathname.includes("/team/") ? "Team member" : current?.label ?? "Admin";
  const initials = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  const toggleTheme = () => {
    const nextTheme = document.documentElement.dataset.adminTheme === "dark" ? "light" : "dark";
    window.localStorage.setItem("berb-admin-theme", nextTheme);
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `berb-admin-theme=${nextTheme}; max-age=31536000; path=/; samesite=lax${secure}`;
    document.documentElement.dataset.adminTheme = nextTheme;
  };

  const goBack = () => {
    const previous = document.referrer;
    if (previous) {
      const previousUrl = new URL(previous);
      if (previousUrl.origin === window.location.origin && previousUrl.pathname.startsWith("/admin")) {
        router.back();
        return;
      }
    }
    router.push("/admin");
  };

  useEffect(() => setNavigationPending(false), [pathname, query]);

  useEffect(() => {
    const startNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      setNavigationPending(true);
    };
    const startHistoryNavigation = () => setNavigationPending(true);
    const startFormNavigation = (event: SubmitEvent) => {
      if (event.target instanceof HTMLFormElement) setNavigationPending(true);
    };
    document.addEventListener("click", startNavigation, true);
    document.addEventListener("submit", startFormNavigation, true);
    window.addEventListener("popstate", startHistoryNavigation);
    return () => {
      document.removeEventListener("click", startNavigation, true);
      document.removeEventListener("submit", startFormNavigation, true);
      window.removeEventListener("popstate", startHistoryNavigation);
    };
  }, []);

  useEffect(() => {
    if (!navigationPending) return;
    const timeout = window.setTimeout(() => setNavigationPending(false), 15000);
    return () => window.clearTimeout(timeout);
  }, [navigationPending]);

  return <div className={`shell${drawerOpen ? " drawer-open" : ""}`}>
    {navigationPending && <div className="navigation-progress" role="status" aria-label="Loading page"><span aria-hidden="true" /></div>}
    <button className="drawer-backdrop" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} tabIndex={drawerOpen ? 0 : -1} />
    <aside className="side" aria-label="Main navigation">
      <Link className="brand" href="/admin" aria-label="BERB admin overview"><span className="brand-mark" aria-hidden="true"><i /><i /></span><span>BERB</span><span className="brand-caption">OPERATIONS</span></Link>
      <div className="nav-label">Workspace</div>
      <nav className="side-nav">
       {navigation
           .filter(({ href }) => href !== "/admin/admins" || role === "owner")
              .map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setDrawerOpen(false)}>
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>{active && <ChevronRight size={15} className="nav-indicator" aria-hidden="true" />}
          </Link>;
        })}
      </nav>
      <div className="side-spacer" />
      <div className="profile-panel"><div className="profile-avatar">{initials}</div><div className="profile-copy"><strong>{name}</strong><span>{role}</span></div>
        <button className="theme-toggle side-theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle light and dark theme" title="Toggle light and dark theme">
          <Sun className="theme-icon-dark" size={18} aria-hidden="true" /><Moon className="theme-icon-light" size={18} aria-hidden="true" />
        </button>
        <form action={logoutAction}><button className="icon-button signout" title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></form>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <button className="icon-button menu-button" aria-label={drawerOpen ? "Close navigation" : "Open navigation"} aria-expanded={drawerOpen} onClick={() => setDrawerOpen((open) => !open)}>
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="breadcrumb"><span>BERB</span><ChevronRight size={15} aria-hidden="true" /><strong>{title}</strong></div>
        {pathname !== "/admin" && <button className="icon-button back-button" type="button" onClick={goBack} aria-label="Back to previous admin page" title="Back">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>}
        <Link className="topbar-action" href="/admin/requests"><Inbox size={16} aria-hidden="true" /><span>View requests</span></Link>
      </header>
      <main className="main" aria-busy={navigationPending}>{children}</main>
      <footer className="workspace-footer"><span>BERB Plumbing</span><span>Operations dashboard</span></footer>
    </div>
  </div>;
}