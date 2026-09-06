import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Gateway",
  description: "Mock payment gateway screen for upcoming payment integration.",
};

type Props = {
  searchParams: Promise<{
    amount?: string;
    type?: string;
    name?: string;
    date?: string;
    slot?: string;
    duration?: string;
  }>;
};

export default async function PaymentGatewayPage({ searchParams }: Props) {
  const p = await searchParams;
  const amount = p.amount ? decodeURIComponent(p.amount) : "0";
  const bookingType = p.type ? decodeURIComponent(p.type) : "booking";
  const name = p.name ? decodeURIComponent(p.name) : "ICUBE booking";
  const date = p.date ? decodeURIComponent(p.date) : "";
  const slot = p.slot ? decodeURIComponent(p.slot) : "";
  const duration = p.duration ? decodeURIComponent(p.duration) : "";
  const backUrl = bookingType === "studio" ? "/#studio" : "/packages";
  const successUrl = `/payment-gateway/success?type=${encodeURIComponent(bookingType)}&name=${encodeURIComponent(
    name
  )}&amount=${encodeURIComponent(amount)}`;

  return (
    <main className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-7 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-icube-gold">Mock payment gateway</p>
          <h1 className="mt-2 text-2xl font-display font-bold">Complete your payment</h1>
          <p className="mt-2 text-sm text-gray-400">
            This is a temporary gateway screen. Real payment provider integration will be connected next.
          </p>

          <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Booking</span>
              <span>{name}</span>
            </div>
            {date && slot ? (
              <div className="flex justify-between">
                <span className="text-gray-400">Schedule</span>
                <span>
                  {date} · {slot}
                  {duration ? ` (${duration}h)` : ""}
                </span>
              </div>
            ) : null}
            <div className="border-t border-white/10 pt-3 flex justify-between font-semibold">
              <span>Total due</span>
              <span className="text-icube-gold">AED {amount}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={successUrl}
              className="inline-flex items-center justify-center rounded-xl bg-icube-gold px-4 py-3.5 font-semibold uppercase tracking-wider text-icube-dark hover:bg-icube-gold-light transition-colors"
            >
              Pay now
            </Link>
            <Link
              href={backUrl}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-3.5 font-semibold uppercase tracking-wider text-white hover:border-white/35 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
