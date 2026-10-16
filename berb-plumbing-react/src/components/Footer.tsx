import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { company } from "../data/company";
import { services } from "../data/services";
import { office } from "../config/office";
import Logo from "./Logo";

export default function Footer() {
  return (
      <footer className="site-footer">
        <div className="container footer-grid">

          {/* Column 1 — Brand */}
          <div className="footer-brand">
            <Logo />
            <p className="footer-tagline">{company.tagline}</p>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={14} aria-hidden="true" className="footer-icon" />
                <div className="footer-address-content">
                  <span>{company.addressLine}</span>
                </div>
              </li>
              <li>
                <Mail size={14} aria-hidden="true" className="footer-icon" />
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </li>
              <li className="footer-phone-row">
                <Phone size={14} aria-hidden="true" className="footer-icon" />
                <div className="footer-phone-content">
                  <a href={company.phoneHref}>{company.phoneDisplay}</a>
                  <div className="footer-social-icons" role="group" aria-label="Social media">
                    <span role="img" aria-label="Facebook"><Facebook size={21} aria-hidden="true" /></span>
                    <span role="img" aria-label="Instagram"><Instagram size={21} aria-hidden="true" /></span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 2 — Navigation */}
          <nav aria-label="Footer navigation">
            <h2 className="footer-title">Navigate</h2>
            <ul className="footer-nav-list">
              <li><a href="#top">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#references">References</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>

          {/* Column 3 — Services */}
          <nav aria-label="Footer services">
            <h2 className="footer-title">Services</h2>
            <ul className="footer-nav-list">
              {services.map((service) => (
                <li key={service.id}>
                  <a href={`#${service.id}`}>{service.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 4 — Office Map */}
          <div className="footer-map-col">
            <h2 className="footer-title">Our Location</h2>
            <a
              className="footer-map-preview"
              href={office.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${office.name} in Google Maps in a new tab`}
            >
              {/* Map preview links directly to the location in a new tab. */}
              <div className="footer-map-thumbnail" aria-hidden="true">
                <iframe
                  src={office.embedUrl}
                  title="map preview"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  tabIndex={-1}
                  style={{ border: 0, pointerEvents: "none" }}
                  aria-hidden="true"
                />
                <div className="footer-map-hint">
                  <MapPin size={14} aria-hidden="true" />
                  <span>Click to open map</span>
                </div>
              </div>
              <div className="footer-map-label">
                <MapPin size={14} aria-hidden="true" />
                <span>{office.name}</span>
              </div>
            </a>
          </div>

        </div>

        <div className="container footer-legal">
          <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          <p className="footer-legal-note">
            Demo recreation for educational purposes. Design reference: BERB Webflow template by Marc Heine.
          </p>
        </div>
      </footer>

  );
}
