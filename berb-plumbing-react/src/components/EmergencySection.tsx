import { Phone } from "lucide-react";
import { company } from "../data/company";
import Reveal from "./Reveal";
import berbCircleSvg from "../assets/688f0cc99930d3597c0aaa0a_BERB_circle.svg";

export default function EmergencySection() {
  return (
    <section id="emergency" className="emergency" aria-labelledby="emergency-title">
      <Reveal variant="scale" duration={1.2} className="emergency-circle-reveal">
        <img src={berbCircleSvg} alt="" aria-hidden="true" className="emergency-circle-bg" />
      </Reveal>
      <div className="container emergency-inner">
        <div className="emergency-copy">
          <Reveal variant="slide-up" delay={0.1}>
            <p className="eyebrow">We help you further</p>
          </Reveal>
          <Reveal variant="slide-up" delay={0.18}>
            <h2 id="emergency-title">Broken pipe? Defective heating?</h2>
          </Reveal>
          <Reveal variant="slide-up" delay={0.28}>
            <p>
              Whether it is a broken pipe, a defective heating system or the installation of a new
              washbasin: get in touch and we will help you out.
            </p>
          </Reveal>
        </div>
        <div className="emergency-action">
          <Reveal variant="slide-up" delay={0.35}>
            <a className="btn btn-light btn-large" href={company.phoneHref}>
              <Phone size={20} aria-hidden="true" /> Call {company.phoneDisplay}
            </a>
          </Reveal>
          <Reveal variant="slide-up" delay={0.45}>
            <a className="emergency-mail" href={`mailto:${company.email}`}>
              or write to {company.email}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
