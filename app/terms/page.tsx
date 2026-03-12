import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ICUBE Media Studio",
  description: "Terms of service for ICUBE Media Studio and ICUBE Vision TV Production.",
};

export default function TermsPage() {
  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium mb-10 transition-colors"
        >
          ← Back to home
        </Link>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-6">
          Terms of Service
        </h1>
        <p className="text-gray-400 font-light leading-relaxed mb-8">
          This page is a placeholder. Please add your terms of service content here before launch.
          Include booking and payment terms, cancellation policy, and use of studio and services.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center py-3 px-6 rounded-xl bg-icube-gold text-icube-dark font-semibold hover:bg-icube-gold-light transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
