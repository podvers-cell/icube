"use client";

import { motion } from "motion/react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

type AnimatedStaggerItemProps = {
  children: React.ReactNode;
  index?: number;
  className?: string;
  /** تأخير إضافي بالثواني (يُضاف إلى index * staggerDelay) */
  delay?: number;
  /** تأخير بين كل عنصر (بالثواني). الافتراضي 0.08 */
  staggerDelay?: number;
};

/**
 * عنصر يظهر بتأثير fade + slide up مع تأخير حسب الترتيب (للقوائم والبطاقات). Hover: subtle lift.
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
