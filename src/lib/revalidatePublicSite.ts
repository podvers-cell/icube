import { requireAuth } from "@/firebase";

/**
 * One place that asks the server to refresh the public pages, shared by every write path.
 *
 * There were two: the api wrapper called one after each mutation, and invalidateSiteCache called
 * another. Five dashboard screens did both, so a single save sent two identical /api/revalidate
 * requests — and the workshop seed action sent more.
 *
 * Rather than auditing which call sites may drop theirs, requests are coalesced here. That keeps
 * every existing caller working, including any that does not go through the api wrapper, while a
 * save results in one request.
 *
 * A call made while a request is in flight joins that request rather than adding another. The two
 * calls from one save always overlap — they run in the same handler — so a save sends exactly one
 * request. A trailing follow-up was tried and removed: it made every save cost two requests again,
 * which is the thing this exists to prevent.
 *
 * The trade-off: a second, genuinely separate save landing while a refresh is still in flight
 * (roughly a few hundred milliseconds) joins that refresh, which was triggered before its write.
 * That edit then appears when the cache window expires rather than immediately. Rare, and a
 * delay rather than a loss.
 */

let inFlight: Promise<void> | null = null;

async function send(): Promise<void> {
  const user = requireAuth().currentUser;
  if (!user) return;
  await fetch("/api/revalidate", {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
}

export function revalidatePublicSite(): Promise<void> {
  // Already refreshing: join it instead of sending a duplicate.
  if (inFlight) return inFlight;

  const current = (async () => {
    try {
      await send();
    } catch (err) {
      // A failed refresh only means the edit appears when the cache expires on its own.
      console.warn("[site] Could not refresh the public site immediately:", err);
    } finally {
      inFlight = null;
    }
  })();
  inFlight = current;
  return current;
}

/** Test seam: forget any in-flight state. */
export function resetRevalidateStateForTests(): void {
  inFlight = null;
}
