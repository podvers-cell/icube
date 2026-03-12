"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

type ParallaxSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** سرعة حركة الخلفية نسبة للسكرول (0 = ثابت، 0.3 خفيف، 0.5 متوسط). Default 0.2 */
  speed?: number;
};

/**
 * قسم مع تأثير parallax خفيف: المحتوى يتحرك أبطأ قليلاً من السكرول (شعور بعمق مثل مواقع أبل).
 * يحترم prefers-reduced-motion.
 */
export default function ParallaxSection({ children, className = "", speed = 0.2 }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [0, 40 * (speed ?? 0.2), 0]);
  const appliedY = reduceMotion ? 0 : y;

  return (
    <motion.div ref={ref} className={className} style={{ y: appliedY }}>
      {children}
    </motion.div>
  );
}
