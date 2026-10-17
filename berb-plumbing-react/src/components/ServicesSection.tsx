import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { services } from "../data/services";
import Reveal from "./Reveal";
import ServiceCard from "./ServiceCard";

interface ServicesSectionProps {
  onSelectService: (formValue: string) => void;
}

export default function ServicesSection({ onSelectService }: ServicesSectionProps) {
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const scrollCards = (direction: number) => {
    const container = carouselRef.current;
    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>(".service-slide");
    if (!firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(container).gap || "24");
    const cardWidth = firstCard.getBoundingClientRect().width + gap;

    container.scrollBy({
      left: direction * cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <section id="services" className="section section-alt" aria-labelledby="services-title">
      <div className="container services-showcase">
        <div className="services-header">
          <div className="services-header-copy">
            <p className="eyebrow services-eyebrow">— Our Services</p>
            <h2 id="services-title">Keeping Islamabad Warm</h2>
          </div>

          <p className="services-intro">
            From plumbing and heating to drainage and electrics, our skilled team will have your home up and running in no time.
          </p>

          <div className="services-nav" aria-label="Service navigation">
            <button type="button" aria-label="Previous services" onClick={() => scrollCards(-1)}>
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next services" onClick={() => scrollCards(1)}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="services-carousel" ref={carouselRef}>
          {services.map((service, i) => (
            <Reveal
              key={service.id}
              variant="slide-up"
              delay={i * 0.1}
              duration={1.0}
              className="service-slide"
            >
              <ServiceCard service={service} onSelect={onSelectService} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
