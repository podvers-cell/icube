# ICUBE Media Studio – Full Audit Report

**Audit date:** March 9, 2025  
**Scope:** Website behaviour, codebase, Next.js/deployment, Firebase/data/auth  
**Method:** Codebase inspection + build verification (no live browser testing)

---

## 1. Executive Summary

**Overall assessment:** The project is a Next.js 16 + React 19 + Firebase + Tailwind 4 marketing and booking site with an admin dashboard. Structure is clear, the build passes, and core flows (home, contact, booking, dashboard) are implemented. Quality is **mixed**: good foundations and consistent UI language, but **validation is minimal**, **security and error-handling gaps** exist, **SEO/metadata are incomplete**, and several **UX and accessibility issues** would hurt a production launch.

**Current level of quality:** **6/10** – Usable for a soft launch with known limitations; not yet “production-hardened” for high traffic or strict compliance.

**Launch readiness score:** **5.5/10**

**Top critical issues:**
1. **Login redirect ignores requested path** – After login, users are always sent to `/dashboard`; the `from` query is read on the Login page but ProtectedRouteNext always redirects with `from=/dashboard`, so e.g. `/dashboard/bookings` is lost.
2. **No server-side or schema validation** – Contact, booking, and dashboard forms rely on HTML `required` and ad-hoc checks; API accepts `body as any`; risk of bad data and injection.
3. **Upload API is unauthenticated** – `POST /api/upload` is public; anyone can upload to Cloudinary up to Cloudinary’s limits.
4. **Credentials in Login UI** – Login page shows “Admin (local): admin@icube.ae / admin123” in plain text.
5. **Root layout metadata overrides** – Root `layout.tsx` sets a generic title/description that can override more specific page metadata depending on Next.js behaviour.
6. **SiteDataContext swallows errors** – On initial load failure, only `loading: false` and fallback settings are set; `portfolio`, `packages`, etc. can stay as empty arrays with no user feedback.
7. **Firebase config throws at build time** – Missing `NEXT_PUBLIC_FIREBASE_*` causes immediate throw in `src/firebase.ts`; no graceful message for missing env in deployment.
8. **Privacy/Terms links are placeholders** – Footer links to `#` for Privacy Policy and Terms of Service.
9. **Sitemap is static and incomplete** – `public/sitemap.xml` lists only 3 URLs and hardcodes `icube.ae`; contact and studio booking routes are missing.
10. **No rate limiting or CSRF** – Forms and API have no rate limiting or CSRF tokens; abuse and spam risk.

---

## 2. Critical Issues

- **Redirect after login loses destination:** `ProtectedRouteNext` always redirects to `/login?from=/dashboard`. If a user opens `/dashboard/bookings` while logged out, they are sent to login with `from=/dashboard` and after login land on `/dashboard`, not `/dashboard/bookings`. **Fix:** Redirect to `/login?from=` + `encodeURIComponent(pathname)` (or equivalent with current path).
- **Upload API unauthenticated:** `app/api/upload/route.ts` does not verify the request; any client can POST files. Only dashboard uses it today, but the route is public. **Fix:** Require a session token or API key (e.g. Firebase ID token in header) and verify before uploading.
- **Admin credentials in UI:** `src/views/Login.tsx` line ~144: “Admin (local): admin@icube.ae / admin123” is visible to all. **Fix:** Remove from production build or restrict to dev only.
- **Firebase env throw:** `src/firebase.ts` throws if any `NEXT_PUBLIC_FIREBASE_*` is missing, which can break build or runtime in CI/Vercel if env is not set. **Fix:** Document required vars and consider a clear error page or message instead of throw when not in build.
- **No form/API validation:** Contact, booking, login, and dashboard POST/PUT bodies are not validated (Zod or similar). `api.ts` uses `body as any` and passes to Firestore. **Fix:** Add shared validation (e.g. Zod) for contact, booking, and dashboard payloads; validate in API layer or server actions.
- **SiteDataContext error handling:** On `refresh()` failure, `api` errors are caught and state is updated with `loading: false` and fallback settings only; other keys (e.g. `portfolio`, `packages`) keep previous or default. Users see no “Failed to load” or retry. **Fix:** Set an `error: string | null` (or similar) and surface retry/error in a top-level banner or in sections that depend on that data.
- **Placeholder legal links:** Footer “Privacy Policy” and “Terms of Service” point to `#`. **Fix:** Add real routes or external URLs before launch.
- **robots.txt / sitemap domain:** `public/robots.txt` references `Sitemap: https://icube.ae/sitemap.xml`. If the site is deployed elsewhere, this is wrong. **Fix:** Use `APP_URL` or a config value to build the sitemap URL, or generate sitemap server-side with the correct origin.

---

## 3. UI / UX Issues

| # | Title | Where | What's wrong | Why it matters | Severity | Recommended fix |
|---|--------|--------|----------------|-----------------|----------|-----------------|
| 1 | Back-to-top and WhatsApp overlap on small screens | `PublicSite.tsx` | Back-to-top is `bottom-36 right-4`, WhatsApp area `bottom-14 right-4`; on short viewports or when WhatsApp bubble is open, they can overlap or feel cramped | Poor mobile UX, possible tap confusion | Medium | Adjust vertical spacing or hide back-to-top when WhatsApp bubble is visible; or move back-to-top left on mobile |
| 2 | WhatsApp bubble hardcoded “1” badge | `PublicSite.tsx` | `<span ... aria-hidden>1</span>` – fake unread count | Misleading; looks like one unread message | Low | Remove badge or make it dynamic if you add real state |
| 3 | Contact form subject vs modal subject options differ | `Contact.tsx` vs `ContactModalContext.tsx` | Section contact has dropdown: Studio Booking, Video Production, General Inquiry. Modal has AREAS_OF_INTEREST (Studio Booking, Video Production, Podcast Production, etc.). Different options and labels | Inconsistent experience and data shape | Medium | Unify subject/area options and labels (single source of truth) |
| 4 | Hero phrase min-height jump on desktop | `Hero.tsx` | `min-h-[3.5rem]` → `md:min-h-[7rem]` – large jump between breakpoints can cause layout shift as phrases rotate | CLS, visual jump | Low | Tune to smoother steps or a single min-height that fits longest phrase |
| 5 | No loading/empty state for portfolio grid | `Portfolio.tsx` | When `items.length === 0` (e.g. no visible or selected work), section still renders with empty space; no “No projects to show” message | Confusing empty section | Medium | Add explicit empty state copy and optional CTA |
| 6 | Testimonials “” around quote | `Testimonials.tsx` | Literal `"{t.quote}"` in JSX adds extra quotes around the quote text | Redundant punctuation | Low | Use `{t.quote}` only or style quotes via CSS |
| 7 | Success state after contact/booking uses generic alert or inline text | `Contact.tsx`, `BookingCheckoutPage`, `StudioBookingCheckoutPage` | Contact: inline “Message sent…”. Booking: full success page. No toast or consistent success pattern | Inconsistent feedback; contact success easy to miss | Low | Consider a shared toast for “Message sent” and align success patterns |
| 8 | Dashboard loading is minimal | `ProtectedRouteNext` | “Loading…” in center of dark screen; no branding or skeleton | Feels unfinished | Low | Add logo or skeleton for dashboard shell |
| 9 | Newsletter in footer does nothing | `Footer.tsx` | `handleNewsletter` sets `submitted(true)` and clears email; no API call or storage | Users may expect to be subscribed | Medium | Either implement subscription (e.g. Firestore or third-party) or remove/replace with “Coming soon” |
| 10 | Studio modal image gallery no lazy load for thumbnails | `Studio.tsx` | All gallery images in modal rendered at once | Heavier DOM and network if many images | Low | Lazy load or virtualize thumbnails when many images |
| 11 | VideoPlayerModal iframe no title per video | `VideoPlayerModal.tsx` | Hero iframe has `title="Hero Background Video"`; portfolio modal uses `title={title}` – ensure every iframe has a unique, descriptive title | A11y and UX | Low | Pass project title (or similar) into modal and set iframe title |
| 12 | Skip to main content always off-screen | `PublicSite.tsx` | Skip link uses `-translate-y-[200%]` and only appears on focus; ensure it’s focusable and visible on focus (it is) | Good; minor: ensure no layout hides it | Low | Verify in all viewports that focus ring is visible |

---

## 4. Responsive / Mobile Issues

| # | Issue | Where | Detail | Severity |
|---|--------|--------|--------|----------|
| 1 | Back-to-top vs WhatsApp vertical stack | `PublicSite.tsx` | Fixed positions can overlap or feel tight on short viewports (e.g. 568px height) | Medium |
| 2 | Hero CTA buttons full-width on small screens | `Hero.tsx` | “Book Studio” and “View Portfolio” are `w-full sm:w-auto` – on very small screens both full width can stack and look heavy | Low |
| 3 | Mobile carousels (Services, Portfolio, Testimonials, Studio) share same pattern but no swipe | `Services.tsx`, `Portfolio.tsx`, `Testimonials.tsx`, `Studio.tsx` | Only prev/next buttons; no touch swipe gesture | Medium |
| 4 | Navbar logo and hamburger spacing on very small devices | `Navbar.tsx` | `px-4` and flex; ensure no overflow or overlap on ~320px width | Low |
| 5 | Contact section two-column grid becomes single column; contact block has `lg:pt-16` | `Contact.tsx` | On desktop form is right, contact block left with extra top padding; on mobile order is form then block – verify reading order and spacing | Low |
| 6 | Dashboard sidebar hidden on small screens | `DashboardLayoutNext.tsx` | `hidden sm:flex` – small screens need another way to open nav (e.g. hamburger + overlay) | High (dashboard unusable on small if no nav) |
| 7 | Modal (Contact, Studio gallery, Video) max-height and scroll | `ContactModalContext`, `Studio.tsx`, `VideoPlayerModal` | `max-h-[90vh] overflow-y-auto` – on small viewports ensure modals don’t overflow and close button stays visible | Low |
| 8 | Booking date/time and checkout forms long on mobile | Booking flow pages | Long forms; consider sticky CTA or progress indicator | Low |
| 9 | Testimonials card equal height on desktop only | `Testimonials.tsx` | `hidden md:grid` with `items-stretch`; mobile carousel cards can vary in height | Low |
| 10 | WhatsApp pill expansion `md:hover:w-[280px]` | `PublicSite.tsx` | On mobile there’s no hover; pill stays small – acceptable but copy “Ask in Whatsapp” only visible on desktop hover | Low |

---

## 5. Frontend / Code Quality Issues

| # | Issue | Where | Detail | Severity |
|---|--------|--------|--------|----------|
| 1 | Duplicate type definitions for portfolio/project | `SiteDataContext.tsx`, `api.ts`, `Portfolio.tsx` | `Project` / `PortfolioProject` with `id: number \| string` and optional flags defined in multiple places | Medium – keep single source (e.g. `api.ts` or shared types) |
| 2 | `api.ts` uses `body as any` for all POST/PUT/PATCH | `src/api.ts` | No type safety on request bodies; typos or wrong shapes can write bad data to Firestore | High |
| 3 | Inconsistent `id` types (number vs string) | Firestore returns string doc ids; some types use `number` (e.g. Service, Testimonial) | Portfolio was fixed to `number \| string`; other entities may still assume number and break when using Firestore doc ids | Medium |
| 4 | Large components not split | `Studio.tsx` (~378 lines), `VideoPlayerModal.tsx` (~369) | Studio contains StudioCard and MobileStudiosCarousel inline; harder to test and maintain | Low |
| 5 | No shared form/validation layer | Entire app | Every form does its own state and submit; no Zod/React Hook Form; repeated patterns | Medium |
| 6 | Magic numbers and strings | e.g. `MAX_SLOT_HOUR = 22`, `WHATSAPP_URL`, `STORAGE_KEY` | Some are constants; others (e.g. section paddings `py-28 md:py-32`) repeated across sections | Low |
| 7 | Dashboard nav items and routes duplicated in list | `DashboardLayoutNext.tsx` | Single `nav` array drives sidebar; adding a route requires adding here and creating `app/dashboard/.../page.tsx` – easy to forget (e.g. Videos) | Low |
| 8 | `DashboardVideos.tsx` exists but no route or nav link | `src/views/DashboardVideos.tsx` | Videos section on site is backed by Firestore; no dashboard page to manage it; dead view file | Medium if videos should be editable |
| 9 | useHash in PublicSite | `PublicSite.tsx` | Custom `useHash()` for scroll-to-section; works but could be a small shared hook if used elsewhere | Low |
| 10 | Commented or obsolete code | Various | e.g. “Admin (local)” on Login – not commented but dev-only content in prod | Low |
| 11 | Inconsistent error handling in forms | Contact, Booking, Login, Dashboard forms | Some use `alert()`, some set error state; no global toast for API errors | Medium |
| 12 | SiteDataContext refresh() on mount only | `SiteDataContext.tsx` | Single `useEffect(() => refresh(), [refresh])`; no refetch on window focus or interval; stale data possible if admin changes content | Low |

---

## 6. Performance Issues

| # | Issue | Where | Recommendation |
|---|--------|--------|----------------|
| 1 | No Next.js Image component | All images use `<img>` (Hero, Portfolio, Studio, Testimonials, etc.) | Use `next/image` for above-the-fold and large images; add `sizes` and priority where appropriate |
| 2 | Hero background image/video | `Hero.tsx` | Background image is full-bleed; use `next/image` with `priority` and appropriate size; video could be lazy-loaded below fold if possible |
| 3 | Single bundle of Firebase + all dashboard code | Client providers wrap entire app with Auth + SiteData + Booking + Contact modal | Dashboard and auth could be loaded only on dashboard routes (e.g. dynamic import of dashboard layout) |
| 4 | SiteDataContext fetches all collections on mount | `SiteDataContext` | One big `Promise.all` for settings, services, portfolio, testimonials, packages, whyUs, studioEquipment, studios, videos; consider splitting by route or lazy loading below-fold data |
| 5 | Fonts loaded from Google (blocking) | `globals.css` | `@import url('https://fonts.googleapis.com/...')` can block render; use `next/font` (e.g. next/font/google) for Inter and Outfit |
| 6 | Motion/AnimatePresence on many sections | PublicSite, Navbar, modals | Acceptable for UX; ensure no layout thrashing; reduce motion on low-end devices if needed (prefers-reduced-motion) |
| 7 | No explicit caching for Firestore reads | Client-side only | Firestore SDK has its own cache; for server-side or API routes, consider cache headers or ISR if you add server data |

---

## 7. Accessibility Issues

| # | Issue | Where | Detail | Severity |
|---|--------|--------|--------|----------|
| 1 | Skip to main content | `PublicSite.tsx` | Present and focusable; ensure it’s the first focusable element and visible on focus | Low (verify) |
| 2 | Nav links and buttons | `Navbar.tsx` | Desktop and mobile nav use `<Link>` and `<button>`; mobile menu button has `aria-label`; carousel “Previous”/“Next” buttons lack explicit labels like “Previous testimonial” | Medium – add `aria-label` to carousel controls |
| 3 | Modal focus trap | `VideoPlayerModal`, `Studio` gallery, Contact modal | Escape closes modals; focus trap and return focus on close not verified | Medium – implement focus trap and return focus |
| 4 | Portfolio cards with video | `Portfolio.tsx` | Card has `role="button"` and `tabIndex={0}` and key handler – good; ensure focus visible | Low |
| 5 | Form labels | Contact, Booking, Login | Labels are present and associated; some inputs use placeholder only – ensure every control has a visible or aria-label | Low |
| 6 | Color contrast | Gold on dark (`--color-icube-gold`, dark bg) | Should be checked against WCAG AA for text and focus rings | Medium – verify contrast ratios |
| 7 | Reduced motion | Animations (motion, Hero scroll bar, phrase rotation) | No `prefers-reduced-motion` handling | Medium – respect `prefers-reduced-motion: reduce` |
| 8 | WhatsApp and back-to-top | `PublicSite.tsx` | WhatsApp link has `aria-label`; back-to-top has `aria-label="Back to top"` – good | – |
| 9 | Loading states | Splash, dashboard loading | No `aria-live` or role for “Loading…” | Low – add `aria-live="polite"` for loading text |
| 10 | Dashboard notification badges | `DashboardLayoutNext` | `aria-label={`${count} new`}` – good | – |

---

## 8. SEO / Metadata / Content Issues

| # | Issue | Where | Detail | Severity |
|---|--------|--------|--------|----------|
| 1 | Root layout metadata | `app/layout.tsx` | `title: "ICUBE Media Studio"`, `description: "ICUBE Media Studio – Production & Media Solutions"` – generic; child pages export their own metadata; in Next.js App Router, child usually overrides, but ensure no conflict | Low |
| 2 | Sitemap static and incomplete | `public/sitemap.xml` | Only `/`, `/packages`, `/portfolio`; missing `/contact`, `/studio/booking/...`, etc.; base URL hardcoded to `https://icube.ae/` | High |
| 3 | robots.txt domain | `public/robots.txt` | `Sitemap: https://icube.ae/sitemap.xml` – fails if deployed on another domain | Medium |
| 4 | Login and Signup | `app/login/page.tsx`, `app/signup/page.tsx` | `robots: "noindex, nofollow"` – correct | – |
| 5 | Open Graph only on home and contact | `app/page.tsx`, `app/contact/page.tsx` | Other routes (portfolio, packages, booking) have no `openGraph` in metadata | Medium |
| 6 | Typo “Whatsapp” | `PublicSite.tsx` | “Ask in Whatsapp” – should be “WhatsApp” | Low |
| 7 | Copy consistency | Contact section vs modal | Different subject/area options and wording; unify for brand voice | Low |
| 8 | No canonical URLs | No page sets `alternates.canonical` | Consider setting canonical for each page to avoid duplicate content with query params | Low |

---

## 9. Security / Validation / Auth Issues

| # | Issue | Where | Detail | Severity |
|---|--------|--------|--------|----------|
| 1 | Upload API unauthenticated | `app/api/upload/route.ts` | No check for Firebase auth or API key; anyone can POST | Critical |
| 2 | Admin credentials in Login page | `src/views/Login.tsx` | “Admin (local): admin@icube.ae / admin123” visible to all visitors | High |
| 3 | No server-side validation of contact/booking | `api.ts` + Firestore | Contact and booking payloads written to Firestore with minimal checks; no length/sanitization or schema validation | High |
| 4 | Dashboard API paths use client-side assertAuth only | `api.ts` | `assertAuth()` checks `firebaseAuth.currentUser`; Firestore rules must enforce read/write by uid; if rules are permissive, any logged-in user could access dashboard data | High – verify Firestore rules |
| 5 | Login redirect from query | Login uses `from` from URL; ProtectedRouteNext ignores current path and always sends `from=/dashboard` | Users cannot return to the page they tried to open | Medium |
| 6 | No rate limiting | Contact, booking, login, upload | Repeated submissions and brute force possible | Medium |
| 7 | No CSRF tokens | All forms | If cookies are used for auth in future, add CSRF; Firebase Auth uses tokens – document intended auth model | Low |
| 8 | Firebase config in client | `src/firebase.ts` | Only `NEXT_PUBLIC_*` – correct; ensure no server secrets in client | – |
| 9 | Contact form and booking form email/phone | No format or length validation beyond `required` and `type="email"` | Invalid or huge input can be stored | Medium |

---

## 10. Maintainability Risks

| # | Risk | Where | Suggestion |
|---|--------|--------|------------|
| 1 | Path-based API in `api.ts` | `api.get(path)`, `api.post(path, body)` with long if-chains | Consider a small router or map of path → handler to avoid typos and make adding routes easier |
| 2 | Duplicate col name mapping (dashboard kind → Firestore collection) | `api.ts` put/delete/patch | Same `kind === "packages" ? "booking_packages" : ...` repeated; extract to a function |
| 3 | Fallback data in SiteDataContext | Large FALLBACK_* constants | Keep fallbacks for resilience; consider moving to a single `fallbacks.ts` and type with same shape as API |
| 4 | BookingContext and sessionStorage | `BookingContext.tsx` | State and key `icube_booking_draft` are fixed; if you add another flow (e.g. “event” booking), consider namespaced keys or separate context |
| 5 | Dashboard nav and route list | Adding a new dashboard section requires: new view, new `app/dashboard/x/page.tsx`, and nav entry | Document the checklist or use a single config that generates routes and nav |
| 6 | No E2E or integration tests | – | Critical paths (booking, contact, login → dashboard) are untested; add Playwright or Cypress for main flows |
| 7 | Env vars | `.env.example` documents vars; `firebase.ts` throws if missing | Document in README and deployment guide; consider a runtime check page for “Configure Firebase” instead of throw in all clients |

---

## 11. Quick Wins

1. **Remove admin credentials from Login** – Delete or guard “Admin (local): admin@icube.ae / admin123” (e.g. `process.env.NODE_ENV === 'development'`).
2. **Fix login redirect** – In `ProtectedRouteNext`, use current pathname (e.g. `usePathname()`) for `from` when redirecting to login.
3. **Fix “Whatsapp” → “WhatsApp”** in `PublicSite.tsx`.
4. **Add `contact` and other public routes to sitemap** – Either expand static `sitemap.xml` or add `app/sitemap.ts` to generate with correct base URL from env.
5. **Privacy / Terms** – Replace `#` with real URLs or `/privacy` and `/terms` placeholders.
6. **Add `robots: "noindex"` for dashboard children** – If you add a layout-level metadata for `/dashboard/*`, set noindex.
7. **Unify contact subject options** – One array for “Subject” or “Area of interest” used by both Contact section and Contact modal.
8. **Dashboard sidebar on mobile** – Add a hamburger + overlay/sheet for nav on `sm` and below so dashboard is usable on phones.
9. **Portfolio empty state** – When `items.length === 0`, show “No projects to show yet” and optional link to contact.
10. **Add `aria-label` to carousel prev/next** – e.g. “Previous slide” / “Next slide” or “Previous testimonial” / “Next testimonial”.

---

## 12. Recommended Priority Plan

### Fix now (before launch)
- Remove or restrict admin credentials on Login page.
- Fix ProtectedRouteNext to pass current path into `from` so post-login redirect goes to the requested page.
- Add authentication (or at least a shared secret/API key) to `POST /api/upload`.
- Add server-side or shared validation for contact and booking payloads (and optionally dashboard).
- Replace footer Privacy/Terms `#` with real or placeholder pages.
- Ensure Firestore security rules restrict dashboard collections to admin uids only.
- Add dashboard mobile nav (sidebar alternative for small screens).

### Fix next (shortly after launch)
- Implement or remove Newsletter (footer) – either wire to a list or show “Coming soon”.
- Use Next.js `Image` for hero and key images; switch fonts to `next/font`.
- Add sitemap generation (dynamic) with `APP_URL` and include contact + main booking routes.
- Add `prefers-reduced-motion` for animations.
- Unify contact subject/area options and error/success patterns (e.g. toast).
- Add explicit error/retry for SiteDataContext when initial load fails.

### Improve later
- Add E2E tests for booking, contact, and login → dashboard.
- Split large components (Studio, VideoPlayerModal); introduce shared form/validation layer.
- Consider lazy loading or splitting dashboard bundle.
- Add rate limiting (e.g. Vercel middleware or serverless) for contact/booking/upload.
- Add canonical URLs and full Open Graph for all public pages.
- Either add `/dashboard/videos` (using `DashboardVideos.tsx`) or remove the unused view.

---

## Top 10 Issues Overall

1. Login redirect loses requested path (ProtectedRouteNext always `from=/dashboard`).
2. Upload API is public (no auth).
3. Admin credentials visible on Login page.
4. No schema/server validation for forms and API bodies.
5. SiteDataContext does not surface load errors to the user.
6. Sitemap static, incomplete, and hardcoded domain.
7. Footer Privacy/Terms point to `#`.
8. Dashboard has no mobile nav (sidebar hidden on small screens).
9. Firestore rules must be verified to enforce admin-only access.
10. No Next.js Image or font optimization; performance and SEO left on the table.

---

## Top 10 Mobile Issues

1. Dashboard sidebar hidden on small screens with no alternative (hamburger + overlay).
2. Back-to-top and WhatsApp fixed positions can overlap on short viewports.
3. No swipe on carousels (Services, Portfolio, Testimonials, Studio).
4. Long booking/contact forms without sticky CTA or progress.
5. Modal max-height and scroll on small viewports to be verified.
6. Hero CTAs full-width on small screens – layout fine but could be tuned.
7. Navbar logo + hamburger spacing on very narrow (e.g. 320px).
8. Contact section order and spacing (form first, then block) on mobile.
9. Testimonials mobile carousel card height not equal (desktop uses stretch).
10. WhatsApp pill doesn’t expand on mobile (hover only on desktop).

---

## Top 10 Code Issues

1. `api.ts` uses `body as any` and no validation for POST/PUT/PATCH.
2. Duplicate or scattered types for Project/Portfolio and entity ids (number vs string).
3. No shared validation/form layer (Zod + optional React Hook Form).
4. Path-based API implemented as long if-chains; easy to miss a path or typo.
5. Dashboard nav and route list are manual; no single config (and Videos missing).
6. `DashboardVideos.tsx` exists with no route or nav link.
7. SiteDataContext refresh only on mount; no refetch on focus or error feedback.
8. Inconsistent error handling (alert vs state vs no feedback).
9. Large single-purpose components (Studio, VideoPlayerModal) not split.
10. Repeated col name mapping in api (packages → booking_packages, etc.); extract helper.

---

## Launch Readiness Verdict

**Not ready** for a high-expectation production launch without addressing the “Fix now” items. With those fixed (auth for upload, no credentials in UI, login redirect, validation, legal links, Firestore rules, dashboard mobile nav), the project is **almost ready** for a soft launch, with the understanding that SEO, performance, and some UX/accessibility improvements should follow soon.

**Summary:** **Almost ready** if you complete the “Fix now” list; **not ready** if you need a fully polished, secure, and SEO-optimized launch from day one.
