"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "icube-cookie-consent";

type ConsentStatus = "accepted" | "declined" | null;

function getStoredConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "accepted" || v === "declined") return v;
  } catch {
    // ignore
  }
  return null;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const status = getStoredConsent();
    setVisible(status === null);
  }, []);

  const setConsent = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -24, opacity: 0 }}
          transition={{ type: "tween", duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-4 left-4 z-[100] sm:bottom-6 sm:left-6 md:left-8 md:bottom-8 max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-lg"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="rounded-2xl border border-white/10 bg-icube-dark/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-icube-gold/20 text-icube-gold">
                <Cookie size={20} aria-hidden />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white text-sm sm:text-base mb-0.5">
                  We use cookies
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  We use cookies to improve your experience, remember your preferences, and analyze site traffic. 
                  You can accept all cookies or decline non-essential ones.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setConsent("declined")}
                className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 text-gray-300 text-sm font-medium hover:bg-white/10 hover:border-white/30 transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => setConsent("accepted")}
                className="px-5 py-2.5 rounded-xl bg-icube-gold text-icube-dark text-sm font-semibold hover:bg-icube-gold-light transition-colors shadow-[0_4px_14px_rgba(212,175,55,0.3)]"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
