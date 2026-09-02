"use client";

import { useMemo, useState } from "react";

type StatusBadgeProps = {
  label: string;
  className: string;
};

export function StatusBadge({ label, className }: StatusBadgeProps) {
  return <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${className}`}>{label}</span>;
}

type BookingFilterTabsProps<T extends string> = {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (tab: T) => void;
  counts: Record<T, number>;
};

export function BookingFilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  counts,
}: BookingFilterTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-icube-gold/20 text-icube-gold border border-icube-gold/40"
                : "bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.label}
            <span
              className={`min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                isActive ? "bg-icube-gold text-icube-dark" : "bg-white/10 text-gray-300"
              }`}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function useBookingFilterCounts<T extends { id: string }>(
  items: T[],
  getCategory: (item: T) => "confirmed" | "awaiting" | "failed"
) {
  return useMemo(() => {
    const counts = { confirmed: 0, awaiting: 0, failed: 0, all: items.length };
    for (const item of items) {
      counts[getCategory(item)] += 1;
    }
    return counts;
  }, [items, getCategory]);
}

export function useFilterTab<T extends string>(defaultTab: T) {
  return useState<T>(defaultTab);
}
