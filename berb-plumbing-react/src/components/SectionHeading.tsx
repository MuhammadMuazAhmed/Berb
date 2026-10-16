import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WEBFLOW_EASE } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  intro?: string;
  id?: string;
  onDark?: boolean;
}

/**
 * Section heading with Webflow-matched slide-in-left animations:
 * - Eyebrow slides from left: x -48px -> 0, opacity 0 -> 1
 * - Title slides from left: x -80px -> 0, opacity 0 -> 1 (delay 0.08s)
 * - Intro text slides from left: x -50px -> 0, opacity 0 -> 1 (delay 0.22s)
 */
export default function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
  onDark,
}: SectionHeadingProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={`section-heading${onDark ? " on-dark" : ""}`}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
        {intro && <p className="section-intro">{intro}</p>}
      </div>
    );
  }

  return (
    <div className={`section-heading${onDark ? " on-dark" : ""}`}>
      {eyebrow && (
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, x: -48 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -50px 0px" }}
          transition={{ duration: 0.85, ease: WEBFLOW_EASE }}
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        id={id}
        initial={{ opacity: 0, x: -80 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.2, margin: "0px 0px -50px 0px" }}
        transition={{ duration: 1.0, delay: 0.08, ease: WEBFLOW_EASE }}
      >
        {title}
      </motion.h2>
      {intro && (
        <motion.p
          className="section-intro"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -50px 0px" }}
          transition={{ duration: 1.0, delay: 0.22, ease: WEBFLOW_EASE }}
        >
          {intro}
        </motion.p>
      )}
    </div>
  );
}
