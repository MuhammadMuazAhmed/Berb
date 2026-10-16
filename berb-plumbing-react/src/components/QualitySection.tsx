import { Layers, ShieldCheck, UserCheck } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import qualityBgImg from "../assets/688f0cc99930d3597c0aaa23_sanitary-hero-image.jpg";

const points = [
  {
    icon: Layers,
    title: "Services from one source",
    text: "Plumbing, heating and solar with one point of contact, so you do not have to coordinate several companies.",
  },
  {
    icon: ShieldCheck,
    title: "Non-binding offers",
    text: "Tell us what you need and we prepare an offer for you without obligation.",
  },
  {
    icon: UserCheck,
    title: "A master business",
    text: "A first-generation master business based in Cologne since 2020.",
  },
];

export default function QualitySection() {
  return (
    <section id="why-choose-us" className="section quality-section" aria-labelledby="quality-title">
      {/* Relatable background image showcasing modern sanitary and master plumbing installations */}
      <img
        src={qualityBgImg}
        alt=""
        aria-hidden="true"
        className="quality-bg-img"
        loading="lazy"
        decoding="async"
      />
      <div className="container quality-inner">
        <SectionHeading
          id="quality-title"
          eyebrow="Why Choose Us"
          title={<>What you <span className="quality-title-contrast">ca</span>n expect fro<span className="quality-title-contrast">m</span> us</>}
        />
        <ul className="quality-grid">
          {points.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Reveal
                variant="scale"
                delay={i * 0.12}
                duration={0.95}
                className="quality-item"
              >
                <Icon size={30} strokeWidth={1.5} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
