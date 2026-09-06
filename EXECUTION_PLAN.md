# iCube — Prioritized Execution Plan

Prepared 2026-09-06. Supersedes `SECURITY_FIX_PLAN.md`, which is now deleted — this file is the
single source of truth and folds in everything that plan contained.

Covers security, correctness, product work and cleanup in one ordered list. Ranked by
**consequence × likelihood × cost of delay**, not by category. Security items are interleaved
where they belong rather than kept in a separate bucket.

Baseline when written: commit `d13faae`, `main` in sync with origin, equipment management complete
but uncommitted, 28 tests passing. Since superseded — see Status below.

---

## Status

**Items 0–13 and 15–20 are done, pushed and verified live.** Only item 14 (deploying the Firestore
rules) is still fully blocked, on a missing service-account permission; item 21 remains optional.

Items 13 and 15 shipped as configuration-gated: the code is live and inert until the owner adds
Turnstile keys and a rate-limit store respectively, at which point each switches itself on with no
further deploy. See `RESUME_STATE.md` for the commit map and the remaining owner actions.

One correction to the original ranking: item 1 was ranked top as an active revenue loss. On
checking the callers, every checkout page creates a *fresh* booking before calling create-intent
and `getRetryUrl` returns a page rather than a resume link, so no customer could reach the lockout
through the UI. It was a latent landmine and a prerequisite for any resume/retry flow — fixed, but
it was not costing money.

## Summary

| # | Item | Status | Why it ranks here | Effort |
|---|------|--------|-------------------|--------|
| **0** | Commit the equipment work | ✅ `798d398` | 10 files of finished work unprotected in the tree | 5 min |
| **1** | Abandoned checkout permanently locks a booking | ✅ `f35164b` | Latent: unreachable via the UI, but blocks any retry flow | 1–2 h |
| **2** | Move the Firebase Admin private key out of the repo | ✅ moved | Full-privilege credential at rest in a synced folder | 10 min |
| **3** | Remove the `admin@icube.ae` backdoor | ✅ `4879680` | Auth defect, possibly claimable account, ~5 lines | 15 min |
| **4** | Burn `UPLOAD_API_KEY` | ✅ local + Vercel | Same secret declared under a browser-exposed prefix | 10 min |
| **5** | Constrain `image_url` to HTTPS | ✅ `3eca446` | Becomes XSS the moment the catalog page renders it | 20 min |
| **6** | Fix the equipment list filter bug | ✅ `3eca446` | Silently hides published items as the catalog grows | 20 min |
| **7** | Explicit public field shape | ✅ `3eca446` | Any future internal field leaks the day it is added | 20 min |
| **8** | Rate-limit the public equipment endpoint | ✅ `3eca446` | Unauthenticated, 500 Firestore reads per call | 15 min |
| **9** | Bind create-intent to the booking owner | ✅ `6c6e2ac` | Authz hole; lets a stranger lock any checkout | 3–4 h |
| **10** | Webhook replay protection | ✅ `f860555` | Signature is verified, replay is not blocked | 1–2 h |
| **11** | Bound the upload route | ✅ `8d58c4b` | Unbounded memory read on a serverless function | 1 h |
| **12** | Retrofit safe error messages | ✅ `358c9e7` | Old routes leak Firestore internals | 1–2 h |
| **13** | Contact form abuse control | ✅ `44e88d4` (keys pending) | Email relay on your Resend account | 2–3 h |
| **14** | Deploy Firestore rules + track drift | ⛔ needs permission | Two rule commits written, none live | blocked |
| **15** | Shared-store rate limiting / WAF | ✅ `bd79682` (store pending) | In-memory limiter is ineffective on serverless | blocked |
| **16** | Content-Security-Policy | ✅ `a65710b` (Report-Only) | Only missing header; needs care not to break the site | 2–3 h |
| **17** | Delete the dead Express server | ✅ `479a4ba` | 6 production deps shipping for nothing | 30 min |
| **18** | Dependency audit | ✅ 10 → 8 via `479a4ba` | 10 moderate transitive findings | 30 min |
| **19** | Repo hygiene | ✅ `479a4ba` | Build artifact tracked, 17 stale docs | 20 min |
| **20** | `next/image` on the catalog | ✅ `0b4f303` | Perf, when the catalog page is built | 1 h |
| **21** | Server-side dashboard gate | ⏳ optional | Defense in depth only; real boundary already holds | 2 h |

---

## Step 0 — Prerequisite

**Commit the equipment work.** Ten files of finished, tested work sit uncommitted:

```
M  firestore.rules              ?? app/api/rental-equipment/
M  src/api.ts                   ?? app/dashboard/rental-equipment/
M  src/views/DashboardLayoutNext.tsx   ?? src/schemas/rentalEquipment.ts
                                ?? src/types/rentalEquipment.ts
                                ?? src/views/DashboardRentalEquipment.tsx (+test)
```

Stage by explicit path — do not use `git add -A`, which would sweep in `next-env.d.ts`,
`tsconfig.tsbuildinfo`, `RESUME_STATE.md` and this file.

Everything below assumes a clean tree.

---

# P0 — Do today

## 1. An abandoned checkout permanently locks the booking

**Severity: corrected after implementation.** Originally ranked top as an active revenue loss.
That was wrong: every checkout page creates a *fresh* booking before calling create-intent, and
`getRetryUrl` returns a page rather than a resume link, so no customer could reach the lockout
through the UI. It was a latent landmine — and a hard blocker for any resume/retry flow — rather
than money already being lost.

**File:** `app/api/payments/ziina/create-intent/route.ts`

`create-intent` writes `ziina_intent_id` to the booking after Ziina returns, then refuses forever:

```ts
if (current.ziina_intent_id) {
  throw new Error("A payment session already exists for this booking.");
}
```

Verified: `redirect_url` is **never persisted** — not in Firestore, not in client state. All three
checkout pages (`BookingCheckoutPage.tsx:113`, `StudioBookingCheckoutPage.tsx:114`,
`WorkshopCheckoutPage.tsx:55`) do `window.location.href = redirect_url` and otherwise surface the
error. There is no recovery path anywhere in the codebase.

Any caller that reuses a booking id — a future resume link, or anyone who holds the id — ends up
with a booking that **can never be paid**. The current UI sidesteps it only by creating a new
booking on every attempt, which leaves orphan `pending_bookings` documents behind instead.

**Fix — allow re-issue when the existing intent is stale and unpaid:**

```ts
if (current.ziina_intent_id) {
  const paid = current.payment_status === "paid" || current.promoted_booking_id;
  if (paid) throw new Error("This booking has already been paid.");
  // otherwise fall through and issue a fresh intent
}
```

Guard it with the existing `INITIALIZATION_LOCK_MS` window so a double-click still collapses into
one intent, and keep the old intent id in a `superseded_intent_ids` array so the webhook can
reconcile a late callback on the abandoned intent.

**Also handle the already-paid case in the UI:** if the booking is paid, send the customer to
`/payment-gateway/success` instead of showing a raw error.

**Verify:** start a checkout, abandon it at Ziina, return and pay again — the second attempt must
succeed. Then confirm a genuinely paid booking still refuses a second intent.

**Note:** item 9 changes the same file. If both are being done in one sitting, do them together.
If not, this half ships independently and is far simpler — do not delay it for item 9.

## 2. Move the Firebase Admin private key out of the project folder

**File:** `icube-817ab-firebase-adminsdk-fbsvc-7835c47937.json` (repo root). No code change.

Correctly gitignored, and verified against the full history — **never committed**. But a
full-privilege private key living in a folder that gets backed up, synced or shared is standing
exposure, and it is the highest-consequence credential in the project.

1. Move it to e.g. `~/.config/icube/firebase-admin.json`.
2. Set `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env.local` to the new path — `src/firebase-admin.ts`
   reads that variable first, so no code changes.
3. Production is unaffected: `readLocalDevServiceAccount()` returns early when `VERCEL === "1"`.

Note that `discoverLocalServiceAccountPaths()` scans the project root for any
`*firebase-adminsdk*.json`, so a stray copy anywhere in the tree silently re-arms this.

## 3. Remove the hardcoded admin backdoor

**File:** `src/AuthContext.tsx`

Line 11 hardcodes an admin identity, and lines 42–48 grant admin from it **and fail open when the
Firestore check itself errors**:

```ts
const ADMIN_EMAIL = "admin@icube.ae";
...
setIsAdmin(emailIsAdmin || adminSnap.exists());
} catch {
  setIsAdmin(emailIsAdmin);   // admin granted because the check failed
}
```

Public signup is open (`src/views/Signup.tsx`), so if `admin@icube.ae` is not already registered in
Firebase Auth, anyone can claim it.

**Fix** — membership document is the only source of truth, and the catch fails closed:

```ts
try {
  const adminSnap = await getDoc(doc(db, "admins", u.uid));
  setIsAdmin(adminSnap.exists());
} catch {
  setIsAdmin(false);
}
```

**Also:** check the Firebase Auth console. If `admin@icube.ae` exists and belongs to nobody,
delete it; if it does not exist, register it to a trusted address so it cannot be claimed.

**Blast radius is UI only** — Firestore rules and `verifyAdminApiRequest` both require the
`admins/{uid}` document, so no data was ever reachable this way. It ranks P0 on cost, not impact:
it is five lines.

## 4. Burn `UPLOAD_API_KEY`

`.env.local` declares `UPLOAD_API_KEY` and `NEXT_PUBLIC_UPLOAD_API_KEY` with **byte-identical
values** — the same secret also declared under the prefix Next.js inlines into the browser bundle.
Verified unreferenced across `app/`, `src/` and `server/`, so Next is not inlining it today, but
the pairing means it was exposed at some point.

Delete both from `.env.local` **and** from the Vercel project environment. Treat the value as
compromised. `/api/upload` is gated by `verifyAdminApiRequest`, so nothing depends on it.

---

# P1 — Before the public catalog page ships

These are cheap now and expensive once the catalog is built on top of them. The catalog page and
the Rent Equipment link are the next planned feature, so this is the window.

## 5. Constrain `image_url` to HTTPS

**File:** `src/schemas/rentalEquipment.ts`

Verified by execution — `z.string().url()` accepts dangerous schemes:

```
javascript:alert(1)         => ACCEPTED
data:text/html,<script>...  => ACCEPTED
```

**Not exploitable today**: `image_url` renders only into `<img src>` in
`DashboardRentalEquipment.tsx:132`, and browsers do not execute `javascript:` there. It becomes a
real stored XSS on a public page the moment that value reaches an `<a href>`, a CSS
`background-image`, or any other sink — which is exactly what building the catalog invites.

```ts
image_url: z.union([
  z.literal(""),
  z.string().url().max(2000).refine((u) => u.startsWith("https://"), "Image URL must use HTTPS"),
]).optional().default("")
```

Better still, restrict to the Cloudinary host, since uploads already flow through it.

## 6. Fix the equipment list filter bug

**File:** `app/api/rental-equipment/route.ts`

```ts
.orderBy("sort_order", "asc").limit(500).get();
const items = snapshot.docs.filter((doc) => includeHidden || doc.data().is_published === true)
```

`limit(500)` is applied by Firestore **before** the in-memory publish filter, so unpublished items
consume the budget. With 400 hidden and 200 published items, the public catalog silently shows a
fraction of what it should — no error, no warning.

```ts
let query = getAdminFirestore().collection("rental_equipment").orderBy("sort_order", "asc");
if (!includeHidden) query = query.where("is_published", "==", true);
const snapshot = await query.limit(500).get();
```

This needs a composite index on `(is_published, sort_order)` — create it before deploying.

Separately, `orderBy("sort_order")` silently excludes any document missing that field. The schema
requires it so new documents are fine, but keep it in mind for any manual Firestore edits.

## 7. Return an explicit public field shape

**File:** `app/api/rental-equipment/route.ts`

`{ id: doc.id, ...doc.data() }` publishes every field a document happens to carry. The schema is
clean today, so nothing leaks — but the day someone adds `cost_price` or `supplier_notes`, it
goes public immediately and silently. Map to an explicit allowlist for the unauthenticated
response; `include_hidden=1` can keep returning everything.

## 8. Rate-limit the public equipment endpoint

**File:** `proxy.ts`

`/api/rental-equipment` is unauthenticated and reads up to 500 Firestore documents per call, and
it is not in `RULES`. Add it. Note that `proxy.ts` currently only matches `POST`, so covering a
public `GET` needs that condition widened — see item 15 for why this is best-effort regardless.

---

# P2 — Security hardening

## 9. Bind payment-intent creation to the booking owner

**Files:** `app/api/payments/ziina/create-intent/route.ts`, `src/lib/bookingPayment.ts`,
`app/api/bookings/create/route.ts`, `src/schemas/booking.ts`, the three checkout pages.

The route performs no authentication and no ownership check — any caller supplying
`{bookingType, bookingId}` gets a payment session for that booking. Combined with the pre-fix
behaviour in item 1, a stranger could permanently lock any booking they had an ID for.

Booking IDs are 20-character Firestore auto-IDs, so they are not practically enumerable, and every
client only receives its own. That is what keeps this at P2 rather than P0 — but it is the largest
remaining authz gap.

**Fix — capability token, so guest checkout keeps working:**

1. In `createPendingBooking`, generate `randomUUID()`, store its SHA-256 hash as
   `checkout_token_hash`, return the raw token.
2. Return it from `/api/bookings/create` alongside `booking_id`; hold it in `BookingContext` in
   memory or `sessionStorage` — **never in the URL**.
3. `create-intent` requires `checkoutToken`, hashes it, compares with `timingSafeEqual` inside the
   existing transaction. Mismatch or missing → 403.
4. Same treatment for `workshop_enrollments` via `/api/workshops/enroll`.

Item 1's re-issue logic must sit behind this check, not in front of it.

## 10. Webhook replay protection

**File:** `app/api/payments/ziina/webhook/route.ts`

HMAC verification is correct (`createHmac` + `timingSafeEqual` with a length guard). What is
missing is replay protection — no timestamp check, no record of consumed events, so any captured
valid delivery can be re-sent indefinitely. Existing idempotency (`promoted_booking_id`,
`counted_at`) limits the damage, but as a side effect of the data model rather than a control.

Claim each event atomically before processing. Do not assume Ziina sends a unique event id —
derive one from the body:

```ts
const eventKey = createHash("sha256").update(rawBody).digest("hex");
const claimed = await db.runTransaction(async (tx) => {
  const ref = db.collection("webhook_events").doc(eventKey);
  if ((await tx.get(ref)).exists) return false;
  tx.set(ref, { provider: "ziina", received_at: FieldValue.serverTimestamp() });
  return true;
});
if (!claimed) return NextResponse.json({ ok: true, ignored: true, reason: "duplicate" });
```

Add a 30-day Firestore TTL policy on `received_at`, and a `webhook_events` rule denying all client
access. If the payload does carry a timestamp, also reject anything older than ~5 minutes.

## 11. Bound the upload route

**File:** `app/api/upload/route.ts`

No size limit anywhere. The whole file is read via `arrayBuffer()` then base64-encoded into a data
URI — a 1.33× expansion on top of the full file — so a large upload can exhaust the function's
memory. `file.type` is client-supplied, and `resource_type: "auto"` accepts anything when `type`
is absent.

1. Reject on `file.size` **before** `arrayBuffer()`: 10 MB images, 100 MB video, → 413.
2. Require an explicit `type`; drop `"auto"` so an unknown type is a 400.
3. Replace the base64 data URI with `cloudinary.uploader.upload_stream` — removes the expansion
   and roughly halves peak memory.

## 12. Retrofit safe error messages

**Files:** `app/api/bookings/booked-slots/route.ts`, `app/api/bookings/inquiry/route.ts`,
`app/api/bookings/create/route.ts`, `app/api/payments/ziina/create-intent/route.ts`,
`app/api/payments/ziina/webhook/route.ts`

All return raw `err.message`, exposing Firestore internals, collection paths and index errors.
`create-intent` is worst — it picks its HTTP status by substring-matching the message text:

```ts
const isClientError = message.includes("required") || message.includes("not found") || ...
```

That is fragile control flow as well as disclosure: rewording an internal error silently changes
the status code.

**The pattern to copy already exists in this repo.** The new rental-equipment routes do it
correctly — generic message to the client, `console.error` with detail server-side. Introduce a
`BookingClientError` carrying an explicit status and safe message, throw it where message-matching
is used today, and make every catch log the real error and return the safe one.

## 13. Contact form abuse control

**File:** `app/api/contact/handler.ts`

Sends a confirmation email to any address supplied, with no proof of control and no CAPTCHA.
Validation (`contactFormSchema`) and HTML escaping are both correct — the gap is purely abuse
control. Combined with item 15, this is an email-bombing vector running on your Resend account,
damaging the sending domain's reputation and writing unbounded Firestore documents.

1. Add Cloudflare Turnstile; verify server-side before any write or send.
2. Per-address cooldown: skip the customer confirmation if that address got one within the hour.

---

# P3 — Blocked on access

## 14. Deploy the Firestore rules, and track the drift

Two rule commits are now written but not live: `adc588a` and the `rental_equipment` rule in the
equipment work. Deployment is blocked — the local service account lacks
`serviceusage.services.use`; it needs an owner/editor account for `icube-817ab`.

**The equipment design is genuinely safe without it.** `allow read, write: if false` on
`rental_equipment` documents an intent that Firestore already enforces: **undeclared paths are
denied by default**, so the collection was closed to clients before the rule was written, and the
Admin SDK bypasses rules entirely. Codex's approach here was correct.

The risk is drift, not exposure. `firestore.rules` in the repo now describes something different
from production, and the gap is growing. Record explicitly in `RESUME_STATE.md` which rule commits
are un-deployed until the permission is sorted.

## 15. Shared-store rate limiting

**File:** `proxy.ts` — blocked on Vercel/Cloudflare account access.

The file is correctly named and placed for the Next.js 16 `proxy` convention (confirmed against
the installed 16.3.4), so the limiter *is* wired up. But the store is a module-level `Map`: on
Vercel each serverless instance keeps its own copy, so the real ceiling is `max × instance count`
and it resets on every cold start. The contact limit of 5/min is not 5/min in production.

Move the counters to Vercel KV / Upstash, or put the limit in Cloudflare's WAF ahead of the app.
The WAF is stronger — it keeps the traffic off the functions entirely.

## 16. Content-Security-Policy

**File:** `next.config.mjs` **or** `vercel.json` — pick one; both currently set overlapping
headers, which is worth consolidating anyway.

`X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy` are set; CSP is absent.

**This will break the site if applied naively.** `app/layout.tsx` has two inline `<script>` blocks
(JSON-LD at line 88, theme bootstrap at line 91), and the theme script running before paint is
what prevents a light/dark flash. Allowed sources must cover Google Tag Manager/Analytics,
Cloudinary, YouTube, Unsplash and Google Fonts.

Ship as `Content-Security-Policy-Report-Only` first and watch for violations:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://img.youtube.com https://www.google-analytics.com;
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://www.google-analytics.com;
frame-src https://www.youtube.com https://www.youtube-nocookie.com;
frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

To drop `'unsafe-inline'` later, move the theme bootstrap to a static file under `public/` or use
a per-request nonce.

---

# P4 — Cleanup

## 17. Delete the dead Express server

`server/` (`index.ts`, `db.ts`, `types.d.ts`) is a legacy Express + SQLite backend. Verified
unreferenced — nothing in `package.json` scripts or `vercel.json` points at it, nothing in `app/`
or `src/` imports it. It is not deployed.

Removing it lets these leave `dependencies`, where they ship to production today: `express`,
`express-session`, `cookie-parser`, `cors`, `bcryptjs`, `better-sqlite3` (a native module that
weighs down every build), plus the matching `@types/*`. `@google/genai` is likewise unreferenced —
remove it too.

## 18. Dependency audit

`npm audit --omit=dev` reports 10 moderate transitive findings, all downstream of `firebase-admin`
(`@google-cloud/firestore`, `@google-cloud/storage`, `google-gax`, `uuid`).

**Do not run `npm audit fix --force`.** `firebase-admin` is pinned to 13.10.0 deliberately —
version 14 requires Node 22 while the Vercel function runtime is older, and a first attempt at 14
broke the server routes in production and had to be rolled back. Revisit after the Vercel runtime
moves to Node 22.

## 19. Repo hygiene

- `tsconfig.tsbuildinfo` is tracked: `git rm --cached tsconfig.tsbuildinfo` and gitignore it. It
  shows modified on every build and adds noise to every diff.
- Seventeen stale planning documents sit in the root (`AUDIT_REPORT.md`, `FIX_PLAN.md`,
  `MIGRATION_*.md`, `IMPROVEMENTS_*.md`, …), all dated March. Move to `docs/archive/` or delete.

## 20. `next/image` on the catalog page

`DashboardRentalEquipment.tsx:132` uses a plain `<img>`. Fine for an admin table; not fine for a
public catalog with dozens of product images — no compression, no responsive sizing, no lazy
loading, and `remotePatterns` in `next.config.mjs` does not apply. Use `next/image` when building
the catalog, and add the Cloudinary pattern if it is not already covered.

## 21. Server-side dashboard gate

Dashboard protection is entirely client-side (`ProtectedRouteNext.tsx` redirects in a
`useEffect`). This is **acceptable as written** — the real boundary is Firestore rules plus
`verifyAdminApiRequest`, both correctly implemented, so an unauthorized visitor reaches an empty
shell and no data. Optional hardening: verify a session cookie in a server component or in
`proxy.ts` so `/dashboard/*` is never served to non-admins.

---

## Minor notes

- `schedule_preference` is optional in `src/schemas/booking.ts`. A request omitting it with no date
  passes validation and produces a legitimately unscheduled booking — no security impact, but the
  field is not guaranteed present on every record for dashboard and email display. Consider
  requiring it for package bookings.
- `app/api/rental-equipment/[id]/route.ts` PUT uses `set(..., { merge: true })`, which creates the
  document if the ID does not exist. Admin-only, and an admin can create anyway, so this is
  harmless — noted only so it is not mistaken for a bug later.

## Out of scope

`~/Desktop/Work/Ai Apps` (the `EnglishLearning` iOS app, 21 Swift files) was reviewed and is clean:
local-only SwiftData persistence, no network calls, no credentials. Nothing to fix.
