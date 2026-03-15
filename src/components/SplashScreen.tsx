"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";

const RADIUS = 56;
const STROKE = 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const startedRef = useRef(false);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let simProgress = 0;
    simIntervalRef.current = setInterval(() => {
      simProgress = Math.min(simProgress + 2.8, 76);
      setProgress(simProgress);
      if (simProgress >= 76) {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
      }
    }, 50);

    const finish = () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setProgress(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 450);
      }, 220);
    };

    // On mobile: don't wait for full page load (images, fonts, etc.) — finish as soon as DOM is ready
    // so the site appears faster on slower mobile networks.
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) {
      if (document.readyState === "loading") {
        const onReady = () => {
          window.removeEventListener("DOMContentLoaded", onReady);
          finish();
        };
        window.addEventListener("DOMContentLoaded", onReady);
        return () => {
          window.removeEventListener("DOMContentLoaded", onReady);
          if (simIntervalRef.current) {
            clearInterval(simIntervalRef.current);
            simIntervalRef.current = null;
          }
        };
      }
      finish();
      return;
    }

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish);
      return () => {
        window.removeEventListener("load", finish);
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
      };
    }
  }, []);

  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  if (!visible) return null;

  return (
    <motion.div
      className="splash-screen"
      data-fade-out={fadeOut}
      aria-hidden="true"
      role="presentation"
      initial={false}
      animate={fadeOut ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="splash-bg-glow" />
      <div className="splash-grid" aria-hidden="true" />

      <div className="splash-content">
        <motion.div
          className="splash-logo-ring-wrap"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <svg
            className="splash-ring"
            viewBox={`0 0 ${(RADIUS + STROKE) * 2} ${(RADIUS + STROKE) * 2}`}
            style={{ width: (RADIUS + STROKE) * 2, height: (RADIUS + STROKE) * 2 }}
          >
            <circle
              className="splash-ring-bg"
              cx={RADIUS + STROKE}
              cy={RADIUS + STROKE}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
            />
            <circle
              className="splash-ring-fill"
              cx={RADIUS + STROKE}
              cy={RADIUS + STROKE}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RADIUS + STROKE} ${RADIUS + STROKE})`}
            />
          </svg>
          <div className="splash-logo-center">
            <Image
              src="/icube-logo.svg"
              alt=""
              width={100}
              height={32}
              className="splash-logo"
              priority
              unoptimized
            />
          </div>
        </motion.div>

        <motion.p
          className="splash-tagline"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          Loading experience
        </motion.p>
      </div>
    </motion.div>
  );
}
