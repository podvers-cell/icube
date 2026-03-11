"use client";

import { motion } from "motion/react";

/**
 * خط فاصل رفيع ذهبي بين الأقسام – يظهر بتأثير رسم عند دخوله الشاشة.
 */
export default function SectionDivider() {
  return (
    <motion.div
      className="w-full shrink-0 overflow-hidden"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ originX: 0 }}
      aria-hidden
    >
      <div className="h-px min-h-px w-full bg-icube-gold/40" />
    </motion.div>
  );
}
