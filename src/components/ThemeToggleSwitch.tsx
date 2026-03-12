"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

type ThemeToggleSwitchProps = {
  theme: "dark" | "light";
  onToggle: () => void;
  size?: "sm" | "md";
  className?: string;
};

export default function ThemeToggleSwitch({
  theme,
  onToggle,
  size = "sm",
  className = "",
}: ThemeToggleSwitchProps) {
  const isDark = theme === "dark";
  const trackW = size === "sm" ? "w-[64px]" : "w-[72px]";
  const trackH = size === "sm" ? "h-7" : "h-8";
  const thumbSize = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const thumbOffset = 3;
  const thumbPx = size === "sm" ? 32 : 36;
  const trackPx = size === "sm" ? 64 : 72;
  const thumbSlideEnd = trackPx - thumbPx - thumbOffset * 2;
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`theme-toggle-switch relative flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-icube-gold focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${trackW} ${trackH} ${className} ${
        isDark
          ? "bg-white/5 border border-white/10"
          : "bg-black/5 border border-black/10"
      }`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sliding thumb with icon inside – single source of truth */}
      <motion.span
        className={`absolute top-1/2 -translate-y-1/2 ${thumbSize} rounded-full flex items-center justify-center shadow-lg ${
          isDark
            ? "bg-white/95 text-icube-dark shadow-black/25"
            : "bg-neutral-800 text-amber-200/90 shadow-black/20"
        }`}
        initial={false}
        animate={{ x: isDark ? thumbOffset : thumbSlideEnd }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{ left: 0 }}
        aria-hidden
      >
        {isDark ? (
          <Moon size={iconSize} strokeWidth={2} className="shrink-0" />
        ) : (
          <Sun size={iconSize} strokeWidth={2} className="shrink-0" />
        )}
      </motion.span>
    </button>
  );
}
