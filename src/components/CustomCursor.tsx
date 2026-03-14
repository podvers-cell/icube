"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const CUSTOM_CURSOR_BODY_CLASS = "custom-cursor-active";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersPointer = window.matchMedia("(pointer: fine)").matches;
    if (!prefersPointer) return;
    setIsPointer(true);

    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      // إظهار المؤشر عند الحركة، وإخفاؤه فقط عند خروج المؤشر من حدود النافذة
      // (تجنب الاعتماد على mouseleave الذي يُستدعى أحياناً فوق iframe أو عناصر أخرى)
      const inViewport =
        e.clientX >= 0 &&
        e.clientY >= 0 &&
        e.clientX <= window.innerWidth &&
        e.clientY <= window.innerHeight;
      setVisible(inViewport);
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const interactive = target.closest("a, button, [role='button'], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      setHover(!!interactive);
    };

    // إخفاء المؤشر فقط عند خروج المؤشر من النافذة تماماً (relatedTarget === null)
    // وليس عند المرور فوق iframe أو عنصر فرعي حتى لا يختفي المؤشر
    const handleLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) setVisible(false);
    };
    document.documentElement.addEventListener("mouseleave", handleLeave);

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseover", handleOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  useEffect(() => {
    if (!isPointer) return;
    document.documentElement.classList.add(CUSTOM_CURSOR_BODY_CLASS);
    return () => document.documentElement.classList.remove(CUSTOM_CURSOR_BODY_CLASS);
  }, [isPointer]);

  if (!isPointer) return null;

  const size = 8;
  const gap = hover ? 6 : 2;

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none w-0 h-0"
      initial={{ opacity: 0 }}
      animate={{
        opacity: visible ? 1 : 0,
        x: position.x,
        y: position.y,
      }}
      transition={{
        type: "spring",
        damping: 28,
        stiffness: 240,
        opacity: { duration: 0.2 },
      }}
      style={{ transform: "translate(-50%, -50%)" }}
      aria-hidden
    >
      {/* Corner brackets – frame that expands on hover */}
      <motion.div
        className="absolute"
        style={{
          width: size * 2 + gap * 2,
          height: size * 2 + gap * 2,
          left: -size - gap,
          top: -size - gap,
        }}
        animate={{ opacity: hover ? 1 : 0.88 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
      >
        {/* top-left */}
        <motion.div
          className="absolute w-[8px] h-[8px] border-t-[1.5px] border-l-[1.5px] border-white rounded-tl"
          style={{ left: 0, top: 0 }}
          animate={{ x: hover ? -4 : 0, y: hover ? -4 : 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
        />
        {/* top-right */}
        <motion.div
          className="absolute w-[8px] h-[8px] border-t-[1.5px] border-r-[1.5px] border-white rounded-tr"
          style={{ right: 0, top: 0 }}
          animate={{ x: hover ? 4 : 0, y: hover ? -4 : 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
        />
        {/* bottom-left */}
        <motion.div
          className="absolute w-[8px] h-[8px] border-b-[1.5px] border-l-[1.5px] border-white rounded-bl"
          style={{ left: 0, bottom: 0 }}
          animate={{ x: hover ? -4 : 0, y: hover ? 4 : 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
        />
        {/* bottom-right */}
        <motion.div
          className="absolute w-[8px] h-[8px] border-b-[1.5px] border-r-[1.5px] border-white rounded-br"
          style={{ right: 0, bottom: 0 }}
          animate={{ x: hover ? 4 : 0, y: hover ? 4 : 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
        />
      </motion.div>
    </motion.div>
  );
}
