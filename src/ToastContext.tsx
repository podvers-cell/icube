"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastType = "success" | "error";

type ToastState = {
  message: string;
  type: ToastType;
  id: number;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showToast: () => {} };
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        typeof document !== "undefined" &&
        document.body &&
        createPortal(
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 max-w-[calc(100vw-2rem)] pointer-events-none"
            aria-live="polite"
            aria-atomic="true"
            role="region"
            aria-label="Notifications"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg min-w-[280px] max-w-md border-white/10 bg-icube-dark/95 backdrop-blur-xl"
                >
                  {t.type === "success" ? (
                    <CheckCircle2 size={20} className="shrink-0 text-icube-gold" aria-hidden />
                  ) : (
                    <XCircle size={20} className="shrink-0 text-red-400" aria-hidden />
                  )}
                  <p className="text-sm font-medium text-white flex-1">{t.message}</p>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="shrink-0 p-1 rounded text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-icube-gold"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
