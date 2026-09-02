import Link from "next/link";
import type { ReactNode } from "react";

type PaymentResultCardProps = {
  icon: ReactNode;
  iconWrapClassName: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
};

export function PaymentResultCard({ icon, iconWrapClassName, title, children, actions }: PaymentResultCardProps) {
  return (
    <main className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border text-2xl ${iconWrapClassName}`}
          >
            {icon}
          </div>
          <h1 className="text-2xl font-display font-bold">{title}</h1>
          <div className="mt-3 space-y-2 text-sm text-gray-300">{children}</div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">{actions}</div>
        </section>
      </div>
    </main>
  );
}

type ActionLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  external?: boolean;
};

export function PaymentActionLink({ href, children, variant = "primary", external }: ActionLinkProps) {
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-xl bg-icube-gold px-5 py-3 font-semibold uppercase tracking-wider text-icube-dark hover:bg-icube-gold-light transition-colors"
      : "inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold uppercase tracking-wider text-white hover:border-white/35 transition-colors";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function VerifiedBookingSummary({
  label,
  amountAed,
  bookingDate,
  timeSlot,
}: {
  label: string;
  amountAed: number | null;
  bookingDate?: string | null;
  timeSlot?: string | null;
}) {
  return (
    <div className="mx-auto mt-4 max-w-sm rounded-xl border border-white/10 bg-black/30 p-4 text-left text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Booking</span>
        <span className="text-right text-white">{label}</span>
      </div>
      {bookingDate ? (
        <div className="mt-2 flex justify-between gap-4">
          <span className="text-gray-400">Date</span>
          <span className="text-right text-white">
            {bookingDate}
            {timeSlot ? ` · ${timeSlot}` : ""}
          </span>
        </div>
      ) : null}
      {amountAed != null ? (
        <div className="mt-3 flex justify-between gap-4 border-t border-white/10 pt-3 font-semibold">
          <span>Total</span>
          <span className="text-icube-gold">{amountAed} AED</span>
        </div>
      ) : null}
    </div>
  );
}
