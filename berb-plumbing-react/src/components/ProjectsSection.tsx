import { useCallback, useRef, useState } from "react";
import { ArrowRight, Expand } from "lucide-react";
import { projects } from "../data/projects";
import Lightbox from "./Lightbox";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function ProjectsSection({ onRequestService }: { onRequestService: () => void }) {
  const [active, setActive] = useState<number | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const open = (index: number, el: HTMLElement) => {
    lastTrigger.current = el;
    setActive(index);
  };

  const close = useCallback(() => {
    setActive(null);
    // give focus back to the thumbnail that opened the lightbox
    requestAnimationFrame(() => lastTrigger.current?.focus());
  }, []);

  return (
    <section id="references" className="section" aria-labelledby="references-title">
      <div className="container">
        <SectionHeading
          id="references-title"
          eyebrow="Our work"
          title="References"
          intro="Take a look at our completed projects across sanitary installations, modern heating systems, and rooftop solar arrays in Cologne."
        />
        <div className="projects-grid">
          {projects.map((p, i) => (
            <Reveal
              key={p.id}
              className={`project-item project-item-${i + 1}`}
              variant="slide-up"
              delay={(i % 2) * 0.12 + Math.floor(i / 2) * 0.08}
              duration={0.95}
            >
              <button
                type="button"
                className="project"
                onClick={(e) => open(i, e.currentTarget)}
                aria-label={`Enlarge image: ${p.title}`}
              >
                <img src={p.image} alt={p.alt} width={1200} height={900} loading="lazy" decoding="async" />
                <span className="project-caption">
                  <span>
                    <small>{p.category}</small>
                    {p.title}
                  </span>
                  <Expand size={18} aria-hidden="true" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
        <Reveal variant="slide-up" delay={0.2} className="section-cta">
          <button type="button" className="btn btn-dark" onClick={onRequestService}>
            Discuss your project <ArrowRight size={18} aria-hidden="true" />
          </button>
        </Reveal>
      </div>
      {active !== null && (
        <Lightbox projects={projects} index={active} onClose={close} onChange={setActive} />
      )}
    </section>
  );
}
