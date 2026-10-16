import { useCallback, useEffect, useState } from "react";
import { Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { company, navItems } from "../data/company";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";

export default function Header({ onRequestService }: { onRequestService: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu if the viewport grows to desktop width.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px)");
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      {/* Topbar: thin info strip */}
      <div className="topbar">
        <div className="container topbar-inner">
          <span>
            <MapPin size={14} aria-hidden="true" /> {company.addressLine}
          </span>
          <a href={`mailto:${company.email}`}>
            <Mail size={14} aria-hidden="true" /> {company.email}
          </a>
          <a href={company.phoneHref}>
            <Phone size={14} aria-hidden="true" /> {company.phoneDisplay}
          </a>
        </div>
      </div>

      {/* Main header — transparent on hero, dark when scrolled past it */}
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
        <div className="container header-inner">
          <Logo showIcon={false} />

          <div className="nav-menu-wrapper">
            <nav className="nav-menu" aria-label="Main">
              <ul className="nav-menu-list">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="berb-nav-link">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <button type="button" className="nav-button" onClick={onRequestService}>
              Request a Service
            </button>
          </div>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={26} aria-hidden="true" /> : <Menu size={26} aria-hidden="true" />}
          </button>
        </div>
        <MobileMenu open={menuOpen} onClose={closeMenu} onRequestService={onRequestService} />
      </header>
    </>
  );
}
