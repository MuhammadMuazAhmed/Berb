import "@fontsource/stix-two-text/600.css";
import "@fontsource/ubuntu/400.css";
import "@fontsource/ubuntu/500.css";
import "./tokens.css";
import "./globals.css";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Script from "next/script";

export const metadata = { title: "BERB Admin", robots: { index: false, follow: false } };
export default async function Root({ children }: { children: ReactNode }) {
  const theme = (await cookies()).get("berb-admin-theme")?.value === "dark" ? "dark" : "light";
  return <html lang="en" data-admin-theme={theme} suppressHydrationWarning><head>
    <Script id="admin-theme-bootstrap" strategy="beforeInteractive">{`try {
      const savedTheme = localStorage.getItem("berb-admin-theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        document.documentElement.dataset.adminTheme = savedTheme;
        document.cookie = "berb-admin-theme=" + savedTheme + "; max-age=31536000; path=/; samesite=lax" + (location.protocol === "https:" ? "; secure" : "");
      }
    } catch {}`}</Script>
  </head><body>{children}</body></html>;
}
