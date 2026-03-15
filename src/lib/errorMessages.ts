/** Map known errors to user-friendly messages (used by SiteDataContext). */
export function toUserFriendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("networkerror") || lower.includes("load failed")) {
    return "Connection problem. Check your internet and try again.";
  }
  if (lower.includes("permission") || lower.includes("unauthorized") || lower.includes("forbidden") || lower.includes("permission_denied")) {
    return "Content is temporarily unavailable.";
  }
  if (lower.includes("unauthenticated") || lower.includes("auth/")) {
    return "Session expired. Please refresh the page.";
  }
  if (lower.includes("firebase") && (lower.includes("not configured") || lower.includes("config") || lower.includes("missing"))) {
    return "Service is being updated. Please try again later.";
  }
  if (lower.includes("unavailable") || lower.includes("resource-exhausted")) {
    return "Service is busy. Please try again in a moment.";
  }
  return msg || "Failed to load content. Please try again.";
}

/** True when the error looks like a network/connectivity issue (offline or timeout). */
export function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("timeout")
  );
}
