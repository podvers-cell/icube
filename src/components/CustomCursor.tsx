"use client";

import { useEffect, useState, useRef } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };
    const tick = () => {
      setPos((prev) => ({
        x: prev.x + (posRef.current.x - prev.x) * 0.2,
        y: prev.y + (posRef.current.y - prev.y) * 0.2,
      }));
      rafRef.current = requestAnimationFrame(tick);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseenter", onEnter);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="custom-cursor fixed top-0 left-0 pointer-events-none"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        zIndex: 2147483647,
      }}
      aria-hidden
    >
      {/* White triangle (cursor shape) with glow – tip at top-left, always on top */}
      <div
        className="w-0 h-0 origin-top-left"
        style={{
          marginLeft: "3px",
          marginTop: "3px",
          borderLeft: "12px solid white",
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          filter: "drop-shadow(0 0 8px rgba(255,255,255,0.95)) drop-shadow(0 0 18px rgba(255,255,255,0.6)) drop-shadow(0 0 28px rgba(255,255,255,0.35))",
        }}
      />
    </div>
  );
}
