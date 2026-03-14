"use client";

import { Play } from "lucide-react";
import { motion } from "motion/react";

/** زر بلاي في المنتصف مع دوائر نابضة – يُستخدم على كروت الفيديو في البورتفوليو والفيديوهات وغيرها */
export function PlayPulseOverlay({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}>
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 w-14 h-14"
          animate={{
            scale: [1, 1.6, 2.2, 1],
            opacity: [0.5, 0.2, 0, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            repeatDelay: 0,
            delay: i * 1.2,
            ease: [0.25, 0.1, 0.25, 1],
            times: [0, 0.3, 0.75, 1],
          }}
        />
      ))}
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-[0_0_24px_rgba(255,255,255,0.2)] transition-opacity duration-300">
        <Play size={26} className="text-white ml-1" fill="currentColor" />
      </div>
    </div>
  );
}
