"use client";

import { motion } from "motion/react";

const defaultTransition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
};

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** تأخير بسيط قبل بدء الأنيميشن (بالثواني) */
  delay?: number;
  /** مقدار الحركة العمودية عند الظهور (بكسل) */
  y?: number;
};

/**
 * غلاف يطبّق أنيميشن ظهور بسيط وراقٍ عند دخول القسم في الشاشة (fade + slide up).
 */
export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
  y = 20,
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        ...defaultTransition,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
