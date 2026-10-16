import { ArrowRight, Droplets, Sun, Thermometer } from "lucide-react";
import Reveal from "./Reveal";
import solarHouseImg from "../assets/360_F_519445978_PEPYf1rgopUdcN31HobzIVv8RAaoqNRE.jpg";

export default function AboutSection({ onRequestService }: { onRequestService: () => void }) {
  return (
    <section id="about" className="section about about-solar" aria-labelledby="about-title">
      <img className="about-background" src={solarHouseImg} alt="" aria-hidden="true" />
      <div className="about-overlay" aria-hidden="true" />
      <div id="team" className="about-team-anchor" />
      <div className="container about-inner">
        <Reveal className="about-copy" variant="slide-left" delay={0.08}>
          <p className="eyebrow">Sanitary / Heating / Solar</p>
          <h2 id="about-title">One master business for water, warmth and sunshine</h2>
          <span className="about-divider" aria-hidden="true" />
          <p>
            The company is a master business, in the 1st generation, which was founded in 2020 in
            Cologne.
          </p>
          <p>
            Our team of employees is specialized in all modern technologies around plumbing, heating
            and solar.
          </p>
          <button type="button" className="about-request" onClick={onRequestService}>
            Request a service <ArrowRight size={19} aria-hidden="true" />
          </button>
        </Reveal>
        <nav className="about-services" aria-label="Our service areas">
          <a href="#sanitary"><Droplets size={27} strokeWidth={1.6} aria-hidden="true" /><span>Sanitary</span></a>
          <a href="#heating"><Thermometer size={27} strokeWidth={1.6} aria-hidden="true" /><span>Heating</span></a>
          <a href="#solar"><Sun size={27} strokeWidth={1.6} aria-hidden="true" /><span>Solar</span></a>
        </nav>
      </div>
    </section>
  );
}
