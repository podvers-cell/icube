"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-icube-dark text-white p-6">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-display font-bold mb-2">Something went wrong</h1>
        <p className="text-gray-400 text-sm mb-4">
          We couldn&apos;t load this page. Please try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-lg hover:bg-icube-gold-light transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
