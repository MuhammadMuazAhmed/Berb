import { Mail, MapPin, Phone } from "lucide-react";
import { company } from "../data/company";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import ctaHelpImg from "../assets/688f0cc99930d3597c0aaa14_berb-cta-help-image.jpg";

export default function ContactSection() {
  return (
    <section id="contact" className="section section-alt" aria-labelledby="contact-title">
      <div className="container contact-grid contact-information">
        <div className="contact-info">
          <SectionHeading
            id="contact-title"
            eyebrow="Contact"
            title="Talk with our team"
            intro="For general enquiries, reach BERB Plumbing directly. For a new job, use our guided service request and tell us what you need."
          />
          <Reveal className="contact-card contact-details-card" variant="slide-up" delay={0.2} duration={1.0}>
            <p className="eyebrow">BERB Plumbing · Cologne</p>
            <h3>Get in touch</h3>
            <ul className="contact-list">
              <li><MapPin size={20} aria-hidden="true" /><span>{company.addressLine}</span></li>
              <li><Mail size={20} aria-hidden="true" /><a href={`mailto:${company.email}`}>{company.email}</a></li>
              <li><Phone size={20} aria-hidden="true" /><a href={company.phoneHref}>{company.phoneDisplay}</a></li>
            </ul>
          </Reveal>
        </div>
        <Reveal className="contact-image-panel" variant="slide-right" delay={0.18} duration={1.0}>
          <div className="contact-image-wrapper">
            <img
              src={ctaHelpImg}
              alt="BERB customer support and reliable plumbing team in Cologne"
              width={800}
              height={450}
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}