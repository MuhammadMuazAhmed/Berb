import { FileText, MessagesSquare, Phone, Wrench } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const steps = [
  { icon: Phone, title: "Get in touch", text: "Call us, write an email or use the form below." },
  { icon: MessagesSquare, title: "Discuss your needs", text: "We talk through what you want done and what your home needs." },
  { icon: FileText, title: "Receive an offer", text: "You get a clear, non-binding offer to look at in your own time." },
  { icon: Wrench, title: "We get to work", text: "Our team carries out the installation or service." },
];

export default function ProcessSection() {
  return (
    <section id="process" className="section section-alt" aria-labelledby="process-title">
      <div className="container">
        <SectionHeading id="process-title" eyebrow="How we work" title="From first call to finished job" />
        <ol className="process-list">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Reveal
                variant="scale"
                delay={i * 0.12}
                duration={0.95}
                className="process-reveal"
              >
                <div className="process-step">
                  <span className="process-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
