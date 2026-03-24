import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Success | ICUBE Media Studio",
  description: "Mock payment success page.",
};

type Props = {
  searchParams: Promise<{
    type?: string;
    name?: string;
    amount?: string;
  }>;
};

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const p = await searchParams;
  const bookingType = p.type ? decodeURIComponent(p.type) : "booking";
  const name = p.name ? decodeURIComponent(p.name) : "ICUBE booking";
  const amount = p.amount ? decodeURIComponent(p.amount) : "0";
  const backUrl = bookingType === "studio" ? "/#studio" : "/packages";

  return (
    <main className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/15 text-2xl text-emerald-300">
            ✓
          </div>
          <h1 className="text-2xl font-display font-bold">Payment completed</h1>
          <p className="mt-2 text-sm text-gray-300">
            Mock payment successful for <span className="text-white font-semibold">{name}</span> (AED {amount}).
          </p>
          <p className="mt-1 text-xs text-gray-500">Replace this page after real gateway integration.</p>

          <Link
            href={backUrl}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-icube-gold px-5 py-3 font-semibold uppercase tracking-wider text-icube-dark hover:bg-icube-gold-light transition-colors"
          >
            Continue
          </Link>
        </section>
      </div>
    </main>
  );
}
