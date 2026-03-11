import Link from "next/link";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-icube-dark via-icube-gray to-[#111521] text-white flex items-center justify-center px-5">
      <div className="max-w-xl w-full text-center bg-white/5 border border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="w-16 h-16 rounded-full bg-icube-gold/15 border border-icube-gold/40 flex items-center justify-center mx-auto mb-5">
          <Wrench className="text-icube-gold" size={28} />
        </div>
        <h1 className="text-3xl font-display font-bold">Website under maintenance</h1>
        <p className="text-gray-400 mt-3">
          We’re currently performing scheduled maintenance. Please check back shortly.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-3 rounded-xl border border-white/15 text-gray-200 hover:bg-white/10 transition-colors"
          >
            Try again
          </Link>
          <Link
            href="/login?from=/dashboard"
            className="px-5 py-3 rounded-xl bg-icube-gold text-icube-dark font-semibold hover:bg-icube-gold-light transition-colors"
          >
            Admin login
          </Link>
        </div>
      </div>
    </div>
  );
}

