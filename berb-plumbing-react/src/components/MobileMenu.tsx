import { useEffect } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { company, navItems } from "../data/company";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onRequestService: () => void;
}

export default function MobileMenu({ open, onClose, onRequestService }: MobileMenuProps) {
  // Close on Escape and lock page scroll while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <div id="mobile-menu" className={`mobile-menu${open ? " is-open" : ""}`} hidden={!open}>
      <nav aria-label="Mobile">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={onClose}>
                {item.label}
              </a>
            </li>
          ))}
          <li><button type="button" className="mobile-request-button" onClick={() => { onClose(); onRequestService(); }}>Request a Service</button></li>
        </ul>
      </nav>
      <ul className="mobile-menu-contact">
        <li>
          <MapPin size={18} aria-hidden="true" /> {company.addressLine}
        </li>
        <li>
          <Mail size={18} aria-hidden="true" /> <a href={`mailto:${company.email}`}>{company.email}</a>
        </li>
        <li>
          <Phone size={18} aria-hidden="true" /> <a href={company.phoneHref}>{company.phoneDisplay}</a>
        </li>
      </ul>
    </div>
  );
}
