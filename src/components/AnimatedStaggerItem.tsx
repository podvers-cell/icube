"use client";

import { motion, useReducedMotion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

type AnimatedStaggerItemProps = {
  children: React.ReactNode;
  index?: number;
  className?: string;
  /** Extra delay in seconds (added to index * staggerDelay) */
  delay?: number;
  /** Delay between each item (seconds). Default 0.08 */
  staggerDelay?: number;
};

/**
 * Item that appears with fade + slide up and staggered delay. Hover: subtle lift.
 */
export default function AnimatedStaggerItem({
  children,
  index = 0,
  className = "",
  delay = 0,
  staggerDelay = 0.08,
}: AnimatedStaggerItemProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.65,
        delay: delay + index * staggerDelay,
        ease,
      }}
      className={`transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}
