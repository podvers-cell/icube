# iCube implementation checkpoint

Updated 2026-09-06.

## Current phase

**All work is pushed and live.** Two deploys verified on production: the security batch
(`d13faae..18df8eb`) and the Rent Equipment catalogue plus the page-title fix
(`18df8eb..c54b4f9`).

Priorities and full detail live in `EXECUTION_PLAN.md`; that file's status column is the index.

The rental catalogue is live at `/rent-equipment` and currently shows its empty state, because no
equipment has been published yet. Add items from the dashboard (Rental Equipment) and tick
Published; the page revalidates within 5 minutes.

## Committed this session (local only)

| Commit | What |
|---|---|
| `798d398` | Rental equipment management (prior session's work, committed to get a clean baseline) |
| `f35164b` | Supersede an abandoned payment intent instead of locking the booking forever |
| `4879680` | Remove the hardcoded `admin@icube.ae` backdoor |
| `3eca446` | Harden rental equipment before the public catalogue |
| `8d58c4b` | Bound the upload route (size limit, streamed upload, resolved resource type) |
| `f860555` | Ziina webhook replay protection |
| `358c9e7` | Stop API routes leaking internal error text |
| `6c6e2ac` | Bind payment-intent creation to the booking owner (checkout token) |
| `479a4ba` | Remove the dead Express server; repo tidy |
| `a65710b` | Content-Security-Policy (Report-Only) and header consolidation |
| `0b4f303` | Public Rent Equipment catalogue, navbar link, sitemap entry |
| `c54b4f9` | Stop duplicating the brand name in every page title |

Also done outside git:

- The Firebase Admin private key was moved out of the repo to `~/.config/icube/firebase-admin.json`
  (mode 600). `.env.local` now sets `FIREBASE_SERVICE_ACCOUNT_PATH`. Production is unaffected —
  it reads `FIREBASE_SERVICE_ACCOUNT_JSON` and never touches disk.
- `UPLOAD_API_KEY` and `NEXT_PUBLIC_UPLOAD_API_KEY` were deleted from `.env.local`. They held
  identical values, one under a browser-exposed prefix. **Still to delete from Vercel.**

## Verification evidence

- TypeScript clean; 63 tests across 12 files pass (was 28 across 7).
- Production build succeeds and reports `Proxy (Middleware)`.
- Against a running production build on port 3111:
  - All five security headers present on `/`, including `Content-Security-Policy-Report-Only`.
  - `/`, `/packages`, `/portfolio`, `/login`, `/contact`, `/packages/schedule` → 200.
  - `/api/health` → 200.
  - `POST /api/upload` unauthenticated → 401.
  - `GET /api/rental-equipment` → 429 on request 61, matching the configured limit of 60/min.
  - No errors in the server log.

## Blocked — needs the owner

1. **Delete `UPLOAD_API_KEY` and `NEXT_PUBLIC_UPLOAD_API_KEY` from the Vercel environment.** Treat
   the value as compromised. Nothing in the code reads it.
2. **Check Firebase Auth for `admin@icube.ae`.** If it exists and belongs to nobody, delete it; if
   it does not exist, register it to a trusted address so it cannot be claimed. The code no longer
   grants anything from it either way.
3. **Deploy the Firestore rules.** Still blocked: the local service account lacks
   `serviceusage.services.use`. Three rule commits are now written and not live — `adc588a`, the
   `rental_equipment` rule, and the new `webhook_events` rule. The repo's rules file describes
   something different from production, and the gap is growing.
   Safety does not depend on this: Firestore denies undeclared paths by default, so both new
   collections are already closed to clients, and the Admin SDK bypasses rules.
4. **Firestore TTL policy on `webhook_events.received_at`** (30 days suggested), or that collection
   grows without bound. Needs console access.
5. **Turnstile keys** for the contact-form abuse control (plan item 13).
6. **Verify video upload against production.** Vercel caps a function's request body at 4.5 MB by
   default, well under the route's 100 MB video bound, so large video uploads likely fail at the
   platform before reaching the app. Untested here.

## Next safe steps

1. Publish real equipment from the dashboard so `/rent-equipment` stops showing its empty state.
2. Watch the CSP violation reports, then promote `Content-Security-Policy-Report-Only` to
   `Content-Security-Policy`.
3. Contact-form abuse control once Turnstile keys exist (plan item 13).
4. Shared-store rate limiting or a Cloudflare WAF (plan item 15). The in-process limiter is
   verified working but is per-instance on serverless, so it is best-effort only.
5. Optional: a cleanup job for orphan `pending_bookings` left by abandoned checkouts.

## Notes for whoever continues

- Records created before `6c6e2ac` have no `checkout_token_hash`. They stay payable and log a
  warning rather than failing, so in-flight bookings survive the deploy. Remove that branch in
  `create-intent` once they have aged out.
- `ClientFacingError` (`src/lib/apiErrors.ts`) is the convention for any message meant for the
  customer. Anything else is logged and answered generically. Follow it in new routes.
- The rental-equipment routes are the reference for new API handlers: admin-gated mutations,
  generic error responses, explicit public field shapes.
- Abandoned checkouts leave orphan `pending_bookings` documents, since each attempt creates a new
  record. Not harmful, but the dashboard's pending list will accumulate them; worth a cleanup job.
