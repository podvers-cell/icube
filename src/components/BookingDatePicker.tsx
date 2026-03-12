"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Props = {
  value: string | null; // YYYY-MM-DD
  onChange: (date: string | null) => void;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
};

function toDate(str: string | null): Date | null {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toYYYYMMDD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplay(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = toDate(dateStr);
  if (!d) return "";
  return d.toLocaleDateString("en-AE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isAfter(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

export default function BookingDatePicker({ value, onChange, min, max }: Props) {
  const valueDate = toDate(value);
  const minDate = min ? toDate(min) : null;
  const maxDate = max ? toDate(max) : null;
  const today = useMemo(() => new Date(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [viewDate, setViewDate] = useState(() => {
    if (valueDate) return new Date(valueDate.getFullYear(), valueDate.getMonth(), 1);
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const startDay = first.getDay();
    const startOffset = startDay === 0 ? 6 : startDay - 1;
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; disabled: boolean }[] = [];

    const prevMonth = new Date(viewYear, viewMonth, 0);
    const prevCount = prevMonth.getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevCount - i);
      const disabled: boolean = !!(
        (minDate && isBefore(d, minDate)) ||
        (maxDate && isAfter(d, maxDate))
      );
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDay(d, today),
        isSelected: valueDate ? isSameDay(d, valueDate) : false,
        disabled: !!disabled,
      });
    }

    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d);
      const disabled: boolean = !!(
        (minDate && isBefore(date, minDate)) ||
        (maxDate && isAfter(date, maxDate))
      );
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        isSelected: valueDate ? isSameDay(date, valueDate) : false,
        disabled: !!disabled,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(viewYear, viewMonth + 1, i);
      const disabled: boolean = !!(
        (minDate && isBefore(date, minDate)) ||
        (maxDate && isAfter(date, maxDate))
      );
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: valueDate ? isSameDay(date, valueDate) : false,
        disabled: !!disabled,
      });
    }
    return days;
  }, [viewYear, viewMonth, valueDate, today, minDate, maxDate]);

  const goPrev = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const goNext = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  const canGoPrev = !minDate || new Date(viewYear, viewMonth, 0) >= minDate;
  const canGoNext = !maxDate || new Date(viewYear, viewMonth + 1, 1) <= maxDate;

  const handleSelect = (d: Date) => {
    const key = toYYYYMMDD(d);
    if (minDate && isBefore(d, minDate)) return;
    if (maxDate && isAfter(d, maxDate)) return;
    onChange(key);
    setOpen(false);
  };

  const setToday = () => {
    const key = toYYYYMMDD(today);
    if (minDate && isBefore(today, minDate)) return;
    if (maxDate && isAfter(today, maxDate)) return;
    onChange(key);
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Date field trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-left text-white focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30 transition-colors hover:bg-white/[0.07]"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar size={20} className="text-icube-gold shrink-0" />
        <span className={value ? "font-medium" : "text-gray-500"}>
          {value ? formatDisplay(value) : "Select date"}
        </span>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[320px] rounded-2xl border border-white/10 bg-icube-gray/95 backdrop-blur-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-display font-semibold text-white text-lg">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 p-3 gap-1" role="grid" aria-label="Calendar">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                type="button"
                disabled={day.disabled}
                onClick={() => handleSelect(day.date)}
                aria-pressed={day.isSelected}
                aria-label={day.isSelected ? `Selected: ${day.date.getDate()}` : `${day.date.getDate()}`}
                className={`
                  aspect-square rounded-xl text-sm font-medium transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed
                  ${!day.isCurrentMonth ? "text-gray-500" : "text-white"}
                  ${day.disabled ? "hover:bg-transparent" : "hover:bg-white/10"}
                  ${day.isToday && !day.isSelected ? "ring-2 ring-icube-gold/60 ring-inset" : ""}
                  ${day.isSelected ? "booking-calendar-day-selected bg-icube-gold text-icube-dark hover:bg-icube-gold-light ring-2 ring-icube-gold ring-offset-2 ring-offset-transparent" : ""}
                  ${!day.isSelected && day.isCurrentMonth && !day.isToday ? "hover:bg-white/10" : ""}
                `}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 bg-white/[0.02]">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-medium text-icube-gold hover:text-icube-gold-light transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={setToday}
              className="text-sm font-medium text-icube-gold hover:text-icube-gold-light transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
