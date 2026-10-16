import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Project } from "../data/projects";

interface LightboxProps {
  projects: Project[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}

export default function Lightbox({ projects, index, onClose, onChange }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const project = projects[index];
  const count = projects.length;

  const prev = () => onChange((index - 1 + count) % count);
  const next = () => onChange((index + 1) % count);

  // Focus the close button on open, lock page scroll, restore on close.
  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onChange((index - 1 + count) % count);
      else if (e.key === "ArrowRight") onChange((index + 1) % count);
      else if (e.key === "Tab" && dialogRef.current) {
        // Simple focus trap
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, count, onClose, onChange]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} – image ${index + 1} of ${count}`}
      ref={dialogRef}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button ref={closeRef} type="button" className="lightbox-btn lightbox-close" onClick={onClose} aria-label="Close image">
        <X size={26} aria-hidden="true" />
      </button>
      <button type="button" className="lightbox-btn lightbox-prev" onClick={prev} aria-label="Previous image">
        <ChevronLeft size={30} aria-hidden="true" />
      </button>
      <figure className="lightbox-figure">
        <img src={project.image} alt={project.alt} />
        <figcaption>
          {project.title} <span>· {project.category}</span>
        </figcaption>
      </figure>
      <button type="button" className="lightbox-btn lightbox-next" onClick={next} aria-label="Next image">
        <ChevronRight size={30} aria-hidden="true" />
      </button>
    </div>
  );
}
