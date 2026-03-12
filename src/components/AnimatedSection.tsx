"use client";

import { motion, useReducedMotion } from "motion/react";

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Vertical movement on appear (pixels) */
  y?: number;
};

/**
 * Wrapper that applies fade + slide up + subtle scale when the section enters view.
 * احترافي بتوقيتات سلسة (أسلوب أبل/سامسونج) مع احترام prefers-reduced-motion.
 */
export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
  y = 36,
}: AnimatedSectionProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y, scale: 0.97 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.85,
        delay,
        ease: easeOutExpo,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
