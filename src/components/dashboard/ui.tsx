"use client";

import type { ComponentType, ReactNode } from "react";

/**
 * Shared dashboard primitives.
 *
 * Every screen previously rolled its own header, card, button and empty state, so spacing, radius
 * and colour drifted page to page. These are the one definition of each, and they are all built
 * mobile-first: nothing here assumes a wide viewport.
 */

/* ---------------------------------------------------------------- page header */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-500">{description}</p>}
      </div>
      {/* Full width on a phone so the primary action is never a cramped tap target. */}
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:w-full">{actions}</div>}
    </header>
  );
}

/* ---------------------------------------------------------------- surfaces */

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={`rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-colors ${className}`}
    >
      {children}
    </Tag>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone?: "default" | "alert";
  href?: string;
}) {
  const alert = tone === "alert";
  const content = (
    <>
      <div className={`mb-3 flex items-start gap-2.5 ${alert ? "text-red-300" : "text-icube-gold"}`}>
        <Icon size={20} className="mt-px shrink-0" />
        <span className="text-sm font-semibold leading-tight">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold text-white sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </>
  );

  const className = `block rounded-xl border p-4 transition-colors sm:p-5 ${
    alert
      ? "border-red-400/40 bg-red-500/10 hover:border-red-400/70"
      : "border-white/10 bg-white/[0.03] hover:border-icube-gold/40"
  }`;

  return href ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

/* ---------------------------------------------------------------- controls */

type ButtonTone = "primary" | "secondary" | "danger" | "ghost";

const buttonTones: Record<ButtonTone, string> = {
  primary: "bg-icube-gold text-icube-dark hover:bg-icube-gold-light",
  secondary: "border border-white/15 text-gray-200 hover:border-icube-gold/50 hover:text-icube-gold",
  danger: "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  ghost: "text-gray-400 hover:text-white hover:bg-white/5",
};

export function Button({
  children,
  tone = "secondary",
  icon: Icon,
  className = "",
  ...rest
}: {
  children?: ReactNode;
  tone?: ButtonTone;
  icon?: ComponentType<{ size?: number }>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonTones[tone]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

/** Square icon-only control. Sized to stay a comfortable tap target on touch screens. */
export function IconButton({
  label,
  icon: Icon,
  tone = "secondary",
  ...rest
}: {
  label: string;
  icon: ComponentType<{ size?: number }>;
  tone?: ButtonTone;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${buttonTones[tone]}`}
    >
      <Icon size={16} />
    </button>
  );
}

/* ---------------------------------------------------------------- badges */

type BadgeTone = "neutral" | "gold" | "success" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "border-white/15 bg-white/5 text-gray-300",
  gold: "border-icube-gold/40 bg-icube-gold/10 text-icube-gold",
  success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
  danger: "border-red-400/40 bg-red-500/15 text-red-300",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- states */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 px-6 py-12 text-center">
      <Icon size={36} className="mx-auto mb-4 text-white/20" />
      <p className="font-medium text-gray-300">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-gray-500" aria-live="polite" aria-busy>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-icube-gold/30 border-t-icube-gold" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6">
      <p className="text-red-300">{message}</p>
      {onRetry && (
        <Button tone="secondary" onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- forms */

export function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-300">
        {label}
        {optional && <span className="ml-1 font-normal text-gray-500">(optional)</span>}
      </span>
      {hint && <span className="mb-2 block text-xs text-gray-500">{hint}</span>}
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-icube-gold/60";

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/50 text-icube-gold focus:ring-icube-gold"
      />
      <span className="min-w-0">
        <span className="block text-sm text-gray-300">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

/* ---------------------------------------------------------------- modal */

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      {/* Full-height sheet on a phone, centred dialog from sm up. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-white/10 bg-icube-gray shadow-2xl sm:max-h-[88vh] sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-white sm:text-xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        <div className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-6">
          {footer ?? (
            <Button tone="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- section */

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/10 pt-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && <p className="mt-0.5 mb-3 text-xs text-gray-500">{description}</p>}
      <div className={description ? "" : "mt-3"}>{children}</div>
    </section>
  );
}
