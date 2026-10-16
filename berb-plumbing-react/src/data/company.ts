/** Company details taken from the reference website. */
export const company = {
  name: "BERB",
  addressLine: "Berbstr. 1, Cologne, Germany",
  email: "berb@gmail.com",
  phoneDisplay: "0221/12 12 23 15",
  phoneHref: "tel:+4922112122315",
  founded: 2020,
  tagline:
    "Berb is a master business, in the 1st generation, which was founded in 2020 in Cologne.",
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: "sanitary", href: "#sanitary" },
  { label: "heating", href: "#heating" },
  { label: "solar", href: "#solar" },
  { label: "references", href: "#references" },
  { label: "team", href: "#team" },
];

export const stats = [
  { id: "founded", value: 2020, suffix: "", label: "Founded", animate: false },
  { id: "team", value: 5, suffix: "", label: "Team members", animate: true },
  { id: "projects", value: 500, suffix: "+", label: "Projects", animate: true },
  { id: "clients", value: 100, suffix: "%", label: "Happy clients", animate: true },
] as const;
