import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowDown } from "lucide-react";
import heroBg from "../assets/Plumbing Videos, Download The BEST Free 4k Stock Video Footage & Plumbing HD Video Clips.mp4";

import { WEBFLOW_EASE } from "./Reveal";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 1.05, ease: WEBFLOW_EASE } },
};

export default function Hero({ onRequestService }: { onRequestService: () => void }) {
  const reduce = useReducedMotion();

  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      {/* Full-bleed background video */}
      <video
        src={heroBg}
        className="hero-bg-img"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />

      {/* Left gradient overlay */}
      <div className="hero-overlay" aria-hidden="true" />

      <div className="container hero-content">
        <motion.div
          className="hero-copy"
          variants={container}
          initial={reduce ? false : "hidden"}
          animate="show"
        >
          <motion.h1 id="hero-title" variants={item}>
            Your plumbing specialist in Cologne
          </motion.h1>
          <motion.p className="hero-lead" variants={item}>
            we are a certified company &amp; provide best plumbing services for you &amp; your
            company.
          </motion.p>
          <motion.div className="hero-actions" variants={item}>
            <button type="button" className="hero-btn-primary" onClick={onRequestService}>
              Request a Service
            </button>
            <a className="hero-btn-ghost" href="#about">
              Learn more <ArrowDown size={18} aria-hidden="true" />
            </a>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
