const DEFAULT_TIMEZONE = "Asia/Dubai";

/**
 * Returns today's date string (YYYY-MM-DD) in the given timezone.
 * Use this so "today" and past-date locking are correct for the region (e.g. Dubai).
 */
export function getTodayInRegion(timeZone: string = DEFAULT_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

/**
 * Returns current time in the given timezone (24h).
 * Use this to lock time slots that have already passed (e.g. in Dubai).
 */
export function getNowInRegion(timeZone: string = DEFAULT_TIMEZONE): { hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hours = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minutes = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return { hours, minutes };
}

/**
 * Returns true if the given date string (YYYY-MM-DD) is "today" in the region.
 */
export function isTodayInRegion(dateStr: string, timeZone: string = DEFAULT_TIMEZONE): boolean {
  return dateStr === getTodayInRegion(timeZone);
}

/**
 * Returns true if the given time slot (e.g. "14:00") has already passed today in the region.
 * Only meaningful when dateStr is today in region.
 */
export function isSlotPastInRegion(
  dateStr: string,
  slotValue: string,
  timeZone: string = DEFAULT_TIMEZONE
): boolean {
  if (!isTodayInRegion(dateStr, timeZone)) return false;
  const [h, m] = slotValue.split(":").map((x) => parseInt(x, 10));
  const slotMinutes = (h ?? 0) * 60 + (m ?? 0);
  const { hours, minutes } = getNowInRegion(timeZone);
  const nowMinutes = hours * 60 + minutes;
  return nowMinutes >= slotMinutes;
}

/** Max selectable date (e.g. 60 days from today in region). */
export function getDateInputMax(daysAhead: number = 60): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}
