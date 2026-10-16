import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

export type RevealVariant =
  | "slide-up"
  | "slide-left"
  | "slide-right"
  | "fade"
  | "scale";

interface RevealProps {
  children: ReactNode;
  /** Seconds to wait before the animation starts (for staggering) */
  delay?: number;
  /** Animation duration in seconds (defaults to 1.0s to match Webflow) */
  duration?: number;
  /** Animation direction / type: 'slide-left' (headings/text) | 'slide-up' (cards/buttons) | 'fade' | 'scale' */
  variant?: RevealVariant;
  /** Optional custom CSS classes */
  className?: string;
  /** Optional inline styles */
  style?: CSSProperties;
  /** Threshold of element visibility needed to trigger (default 0.15) */
  amount?: number | "some" | "all";
  /** Root margin offset for intersection */
  margin?: string;
}

/**
 * Webflow's outQuart easing curve: cubic-bezier(0.165, 0.84, 0.44, 1).
 * Produces the signature smooth deceleration used across all scroll interactions.
 */
export const WEBFLOW_EASE: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

const VARIANTS: Record<RevealVariant, Variants> = {
  "slide-up": {
    hidden: { opacity: 0, y: 64 },
    visible: { opacity: 1, y: 0 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -72 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 72 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.88 },
    visible: { opacity: 1, scale: 1 },
  },
};

/**
 * High-fidelity scroll reveal component matching the Webflow reference site animations.
 * Provides slideInLeft (for headings/text), slideInBottom (for cards/buttons),
 * fadeIn (for stats/badges), and scale (for decorative graphics).
 * Gracefully disables with prefers-reduced-motion for accessibility.
 */
export default function Reveal({
  children,
  delay = 0,
  duration = 0.95,
  variant = "slide-up",
  className,
  style,
  amount = 0.15,
  margin = "0px 0px -60px 0px",
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const selectedVariants = VARIANTS[variant] || VARIANTS["slide-up"];

  return (
    <motion.div
      className={className}
      style={style}
      variants={selectedVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin }}
      transition={{
        duration,
        delay,
        ease: WEBFLOW_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}
