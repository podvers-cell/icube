"use client";

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

/**
 * The one dialog for the whole dashboard.
 *
 * Every screen used to hand-roll its own: overlays at black/70 and black/80, panels on three
 * different radii and two different backgrounds, widths from lg to 3xl, some with a pinned footer
 * and some that scrolled the buttons out of reach. None of them trapped focus, closed on Escape,
 * or locked the page behind them — the focus-trap hook already in this repo went unused.
 *
 * Behaviour, everywhere: a full-height sheet on a phone and a centred dialog from sm up; header
 * and footer pinned so the primary action is always reachable; Escape and the backdrop close it;
 * focus is trapped while open and returned to the trigger on close; the page behind cannot scroll.
 */

type Size = "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
};

type Props = {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Buttons for the pinned footer. Omit for a read-only dialog. */
  footer?: ReactNode;
  size?: Size;
  /** When set, the dialog is a <form> and this runs on submit. */
  onSubmit?: (e: FormEvent) => void;
};

export default function DashboardModal({
  title,
  description,
  onClose,
  children,
  footer,
  size = "lg",
  onSubmit,
}: Props) {
  // One ref serves both the form and the div branch, so it is typed to their common base.
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(panelRef, true);

  useEffect(() => {
    // Move focus into the dialog explicitly. Relying on the trap hook to focus the first control
    // left focus on <body> here, which meant Tab started outside the dialog and screen readers
    // never announced it.
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    // Hold the page still behind the dialog, and keep its width so it does not jump when the
    // scrollbar disappears.
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      // Hand focus back to whatever opened the dialog, when it is still on the page.
      if (opener?.isConnected) opener.focus();
    };
  }, [onClose]);

  const body = (
    <>
      <header className="flex shrink-0 items-start gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-lg font-bold text-white sm:text-xl">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-gray-500">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

      {footer && (
        <footer className="flex shrink-0 flex-wrap gap-2 border-t border-white/10 px-5 py-4 sm:px-6">
          {footer}
        </footer>
      )}
    </>
  );

  const panelClass = `outline-none flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-icube-gray shadow-2xl sm:max-h-[88vh] sm:rounded-2xl ${sizes[size]}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        // Only a press that starts on the backdrop closes, so a drag out of a text field does not.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form
          ref={panelRef as React.Ref<HTMLFormElement>}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          onSubmit={onSubmit}
          tabIndex={-1}
          className={panelClass}
        >
          {body}
        </form>
      ) : (
        <div
          ref={panelRef as React.Ref<HTMLDivElement>}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={panelClass}
        >
          {body}
        </div>
      )}
    </div>
  );
}
