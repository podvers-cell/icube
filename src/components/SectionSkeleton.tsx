"use client";

/**
 * Simple skeleton placeholder for a section while data is loading.
 * Use when loading is true to avoid layout shift and show progress.
 */
export default function SectionSkeleton({
  className = "",
  lines = 3,
  showHeader = true,
}: {
  className?: string;
  lines?: number;
  showHeader?: boolean;
}) {
  return (
    <div className={`animate-pulse ${className}`} aria-hidden>
      {showHeader && (
        <div className="mb-8">
          <div className="h-4 w-32 rounded bg-white/10 mb-2" />
          <div className="h-10 w-64 rounded bg-white/10" />
        </div>
      )}
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-white/10" style={{ width: `${85 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}
