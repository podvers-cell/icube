# iCube implementation checkpoint

Updated 2026-09-07.

## Blocker: Firestore quota exhausted (external)

`icube-817ab` is returning **429 RESOURCE_EXHAUSTED — "Quota exceeded."** Verified repeatedly
against the Firestore REST API during this session, most recently after the review fixes.

This is not a code fault and cannot be fixed in this repo. Until the quota resets or the plan is
upgraded:

- **Dashboard uploads will not complete.** The signature endpoint reads the `admins` document, and
  that read fails. The upload now reports *"Could not verify your access right now"* with HTTP 503
  rather than the old, misleading *"Invalid or expired authentication"* — but it still cannot
  proceed.
- Any other admin API call that checks admin membership is affected the same way.
- The public site is unaffected: it is server-rendered and cached, so it is not reading Firestore
  per request.

Do not read a successful deploy as evidence that uploads work. That needs a real admin session
**and** a working quota.

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
| `01188d3` | Fix typing in dialogs, and edits not appearing on the site |
| `ae89976` | Upload straight to Cloudinary instead of through Vercel |
| `deb2ffc` | Let the portfolio page paint before the delete prompt |
| `66aef33` | Separate auth failure modes; rental equipment gallery |
| `94ec504` | Review fixes: image limit in the form, scrollable thumbnails, unified public URL validation, adminApiAuth tests |
| `44e88d4` | Contact form abuse controls (Turnstile-ready + per-address cooldown) |
| `bd79682` | Shared store support for rate limiting (Upstash / Vercel KV) |

Also done outside git:

- The Firebase Admin private key was moved out of the repo to `~/.config/icube/firebase-admin.json`
  (mode 600). `.env.local` now sets `FIREBASE_SERVICE_ACCOUNT_PATH`. Production is unaffected —
  it reads `FIREBASE_SERVICE_ACCOUNT_JSON` and never touches disk.
- `UPLOAD_API_KEY` and `NEXT_PUBLIC_UPLOAD_API_KEY` were deleted from `.env.local` **and from
  Vercel** (owner confirmed). Production re-checked afterwards: unaffected, as expected — nothing
  in the codebase read either name.

## Verification evidence

- TypeScript clean; **138 tests across 22 files pass** (was 28 across 7).
- Production build succeeds and reports `Proxy (Middleware)`.
- Against a running production build on port 3111:
  - All five security headers present on `/`, including `Content-Security-Policy-Report-Only`.
  - `/`, `/packages`, `/portfolio`, `/login`, `/contact`, `/packages/schedule` → 200.
  - `/api/health` → 200.
  - `POST /api/upload` unauthenticated → 401.
  - `GET /api/rental-equipment` → 429 on request 61, matching the configured limit of 60/min.
  - No errors in the server log.
- Rate limiting re-verified after the shared-store change: 429 on request 61 with no store
  configured, and with a deliberately unreachable store URL the site still served 200s while the
  local counter still produced a 429 — an outage degrades the limit rather than breaking the site.
- Production re-checked after every deploy: pages 200, `/api/upload` and `POST
  /api/rental-equipment` 401, malformed `/api/contact` 400, CSP header present.

## Blocked — needs the owner

1. **Check Firebase Auth for `admin@icube.ae`.** If it exists and belongs to nobody, delete it; if
   it does not exist, register it to a trusted address so it cannot be claimed. The code no longer
   grants anything from it either way.
2. **Deploy the Firestore rules.** Still blocked: the local service account lacks
   `serviceusage.services.use`. Four rule commits are now written and not live — `adc588a`, the
   `rental_equipment` rule, `webhook_events`, and `contact_confirmation_cooldowns`. The repo's rules file describes
   something different from production, and the gap is growing.
   Safety does not depend on this: Firestore denies undeclared paths by default, so both new
   collections are already closed to clients, and the Admin SDK bypasses rules.
3. **Firestore TTL policies**, or these collections grow without bound. Needs console access:
   `webhook_events.received_at` (30 days) and `contact_confirmation_cooldowns.last_sent_at`
   (7 days).
4. **Turnstile keys.** The server side is done and deployed; verification stays off until
   `TURNSTILE_SECRET_KEY` is set. Add the key *and* the front-end widget together — see
   `.env.example`.
5. **Optional: a shared rate-limit store.** Attach Vercel KV or Upstash and the limits become
   global; see `.env.example`. Until then they remain per-instance and best-effort.
6. **Verify video upload against production.** Vercel caps a function's request body at 4.5 MB by
   default, well under the route's 100 MB video bound, so large video uploads likely fail at the
   platform before reaching the app. Untested here.

## Next safe steps

1. Publish real equipment from the dashboard so `/rent-equipment` stops showing its empty state.
2. Watch the CSP violation reports, then promote `Content-Security-Policy-Report-Only` to
   `Content-Security-Policy`.
3. Add the Turnstile widget to the contact form and set the keys — the server half is already live.
4. Optional: a cleanup job for orphan `pending_bookings` left by abandoned checkouts.
5. Optional: a server-side gate on `/dashboard` (plan item 21) for defence in depth.

## Verified for the latest change

- TypeScript clean, production build succeeds, ESLint unchanged at 107 pre-existing problems.
- 138 tests pass, including direct coverage of `verifyAdminApiRequest`: invalid token → 401,
  valid token with no admins record → 403, admins read failing → 503, real admin → success.
- Both new regression suites were confirmed to fail when their fix is reverted, rather than
  passing vacuously.
- Live: `/api/upload/signature` returns 401 without auth and with a bogus token, and the public
  pages return 200.

## Cannot be verified without an admin session

These need a signed-in admin **and** a working Firestore quota, so they remain untested:

1. A real image or video upload completing end to end.
2. The single token retry firing against a genuinely expired token.
3. Adding, reordering and removing several images on one product.
4. Opening a pre-gallery product, saving unchanged, and confirming its image survives.
5. The public gallery strip, which needs a published product with more than one image.

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
- Rental products carry `image_urls` (max 10, first is the cover) and still write `image_url` as
  the first image. Older products are never migrated; `rentalImages()` in
  `src/types/rentalEquipment.ts` is the one place that reconciles the two.
- Removing an image from a product detaches the reference only. Cloudinary files are never deleted
  automatically, so orphaned assets accumulate there and need a manual clear-out eventually.
