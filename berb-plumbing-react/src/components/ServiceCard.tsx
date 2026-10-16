import { ArrowRight } from "lucide-react";
import type { Service } from "../data/services";

interface ServiceCardProps {
  service: Service;
  onSelect: (formValue: string) => void;
}

export default function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const titleId = `${service.id}-title`;

  return (
    <article id={service.id} className="service-card" aria-labelledby={titleId}>
      <div className="service-image">
        <img
          src={service.image}
          alt={service.imageAlt}
          width={1200}
          height={900}
          loading="lazy"
          decoding="async"
        />

        <div className="service-hover-panel">
          <p className="eyebrow service-hover-eyebrow">{service.eyebrow}</p>
          <h3 id={titleId}>{service.title}</h3>
          <p className="service-text">{service.description}</p>
          <button
            className="service-link"
            type="button"
            onClick={() => onSelect(service.formValue)}
            aria-label={`Request ${service.title}`}
          >
            {service.title} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="service-card-footer" aria-hidden="true">
        <span>{service.title}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </div>
    </article>
  );
}
