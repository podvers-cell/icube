"use client";

export default function DashboardLayoutLoading() {
  return (
    <div className="min-h-screen bg-icube-dark flex flex-col items-center justify-center gap-6" aria-busy="true">
      <img src="/icube-logo.svg" alt="" className="h-12 w-auto opacity-90" aria-hidden />
      <div className="h-8 w-8 rounded-full border-2 border-icube-gold/30 border-t-icube-gold animate-spin" aria-hidden />
      <p className="text-gray-400 text-sm">Loading…</p>
    </div>
  );
}
