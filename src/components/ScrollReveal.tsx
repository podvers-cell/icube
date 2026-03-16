"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

const easeOutExpo = [0.16, 1, 0.3, 1] as const;
const easeOutSmooth = [0.25, 0.46, 0.45, 0.94] as const;

export type ScrollRevealVariant = "fadeUp" | "fadeUpScale" | "fadeIn" | "revealLeft" | "revealRight" | "stagger";

type ScrollRevealProps = {
  children: React.ReactNode;
  variant?: ScrollRevealVariant;
  className?: string;
  delay?: number;
  duration?: number;
  /** نسبة ظهور العنصر في viewport لبدء الأنيميشن (0–1). Default 0.12 */
  amount?: number;
};

type MotionState = { opacity?: number; x?: number; y?: number; scale?: number };

const variants: Record<
  ScrollRevealVariant,
  { initial: MotionState; animate: MotionState; transition?: { duration?: number; delay?: number; ease?: readonly number[] } }
> = {
  fadeUp: {
    initial: { opacity: 0, y: 48 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, ease: easeOutExpo },
  },
  fadeUpScale: {
    initial: { opacity: 0, y: 36, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.7, ease: easeOutExpo },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: easeOutSmooth },
  },
  revealLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.65, ease: easeOutExpo },
  },
  revealRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.65, ease: easeOutExpo },
  },
  stagger: {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: easeOutSmooth },
  },
};

export default function ScrollReveal({
  children,
  variant = "fadeUp",
  className = "",
  delay = 0,
  duration,
  amount = 0.12,
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const config = variants[variant];
  const baseTransition = config.transition;
  const transition = {
    delay: delay + (baseTransition?.delay ?? 0),
    duration: duration ?? baseTransition?.duration ?? 0.65,
    ease: baseTransition?.ease ? [...baseTransition.ease] : undefined,
  };

  const initial = reduceMotion ? { opacity: 1, y: 0, x: 0, scale: 1 } : config.initial;
  const animate = reduceMotion ? { opacity: 1, y: 0, x: 0, scale: 1 } : config.animate;

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, amount }}
      transition={transition as React.ComponentProps<typeof motion.div>["transition"]}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** لاستخدامه كـ wrapper لـ عناصر متعددة تظهر بتأخير متتالي (stagger) */
export function ScrollRevealStagger({
  children,
  className = "",
  staggerDelay = 0.1,
  amount = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  amount?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.1 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const scrollRevealItemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* Section header scroll animation: staggered label → title → accent line → optional text */
const sectionHeaderEase = [0.22, 1, 0.36, 1] as const;
export const sectionHeaderContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.06,
    },
  },
};
/* No filter:blur – animating blur is very expensive on mobile GPU and causes jank/heat */
export const sectionHeaderLabelVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: sectionHeaderEase },
  },
};
export const sectionHeaderTitleVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: sectionHeaderEase },
  },
};
export const sectionHeaderLineVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.5, ease: sectionHeaderEase },
  },
};
export const sectionHeaderTextVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: sectionHeaderEase },
  },
};

type AnimatedSectionHeaderProps = {
  children: React.ReactNode;
  className?: string;
  amount?: number;
};

export function AnimatedSectionHeader({ children, className = "", amount = 0.2 }: AnimatedSectionHeaderProps) {
  const reduceMotion = useReducedMotion();
  const noMotion = reduceMotion
    ? {
        hidden: {},
        visible: { transition: { staggerChildren: 0, delayChildren: 0 } },
      }
    : null;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={noMotion ?? sectionHeaderContainerVariants}
    >
      {noMotion
        ? children
        : (() => {
            const count = React.Children.count(children);
            const useLineVariantsAtIndex2 = count >= 4;
            return React.Children.map(children, (child, index) => {
              const variants =
                index === 0
                  ? sectionHeaderLabelVariants
                  : index === 1
                    ? sectionHeaderTitleVariants
                    : index === 2 && useLineVariantsAtIndex2
                      ? sectionHeaderLineVariants
                      : sectionHeaderTextVariants;
              return (
                <motion.div
                  key={index}
                  variants={variants}
                  style={index === 2 && useLineVariantsAtIndex2 ? { transformOrigin: "center center" } : undefined}
                >
                  {child}
                </motion.div>
              );
            });
          })()}
    </motion.div>
  );
}
