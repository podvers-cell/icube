"use client";

import { motion } from "motion/react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.5,
        delay: delay + index * staggerDelay,
        ease,
      }}
      className={`transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}
