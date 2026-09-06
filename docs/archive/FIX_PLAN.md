# ICUBE Media Studio – Actionable Fix Plan

Converted from `AUDIT_REPORT.md`. Each item lists **exact files** and **concrete steps**. Grouped by priority.

---

## Priority 1: Critical (fix before launch)

### 1.1 Login redirect loses requested path

| Step | File | Action |
|------|------|--------|
| 1 | `src/views/ProtectedRouteNext.tsx` | Import `usePathname` from `next/navigation`. |
| 2 | Same | Replace `router.replace("/login?from=" + encodeURIComponent("/dashboard"))` with redirect using current pathname: `const pathname = usePathname(); ... router.replace("/login?from=" + encodeURIComponent(pathname || "/dashboard"))`. |

**Result:** User opening `/dashboard/bookings` while logged out will land on `/dashboard/bookings` after login.

---

### 1.2 Admin credentials visible on Login page

| Step | File | Action |
|------|------|--------|
| 1 | `src/views/Login.tsx` | Remove or guard the line that shows "Admin (local): admin@icube.ae / admin123". |
| 2 | Same | Show that line only when `process.env.NODE_ENV === "development"` (or use a wrapper that renders it only in dev). |

**Result:** Production builds do not expose credentials.

---

### 1.3 Upload API unauthenticated

| Step | File | Action |
|------|------|--------|
| 1 | `.env.example` | Add `UPLOAD_API_KEY` (and optionally `NEXT_PUBLIC_UPLOAD_API_KEY` if client must send it – see note below). |
| 2 | `app/api/upload/route.ts` | At start of `POST`, read `request.headers.get("x-upload-key")` (or `Authorization: Bearer <key>`). Return 401 if missing or not equal to `process.env.UPLOAD_API_KEY`. |
| 3 | `src/lib/uploadCloudinary.ts` | When sending the request, set header `x-upload-key` (or `Authorization`) from `process.env.NEXT_PUBLIC_UPLOAD_API_KEY`. Use the same value as `UPLOAD_API_KEY` in env. |
| 4 | Document | In FIX_PLAN or README: for stronger security, use Firebase ID token + `firebase-admin` to verify the caller is logged-in admin. |

**Note:** Using a shared key in the client (`NEXT_PUBLIC_*)` is a minimal fix; the key is visible in the bundle. Prefer server-side upload (e.g. server action that reads env and uploads) or Firebase ID token verification for production.

**Result:** Only requests that send the correct key can upload.

---

### 1.4 Placeholder Privacy / Terms links in footer

| Step | File | Action |
|------|------|--------|
| 1 | `src/components/Footer.tsx` | Replace `<a href="#">Privacy Policy</a>` with `<Link href="/privacy">Privacy Policy</Link>`. Same for Terms: `<Link href="/terms">Terms of Service</Link>`. |
| 2 | `app/privacy/page.tsx` | Create page with `metadata` (title "Privacy Policy \| ICUBE Media Studio") and placeholder content (heading + short text). |
| 3 | `app/terms/page.tsx` | Create page with `metadata` (title "Terms of Service \| ICUBE Media Studio") and placeholder content. |

**Result:** Legal links point to real routes; content can be filled later.

---

### 1.5 Dashboard unusable on mobile (no nav)

| Step | File | Action |
|------|------|--------|
| 1 | `src/views/DashboardLayoutNext.tsx` | Add state `const [mobileNavOpen, setMobileNavOpen] = useState(false)`. |
| 2 | Same | On small screens (`sm:hidden`), show a hamburger button that toggles `mobileNavOpen`. |
| 3 | Same | When `mobileNavOpen`, render an overlay (fixed full-screen) containing the same `nav` links as the sidebar; closing the overlay or clicking a link sets `mobileNavOpen` to false. |
| 4 | Same | Optionally lock body scroll when overlay is open (as in public Navbar). |

**Result:** Dashboard is usable on phones and small tablets.

---

## Priority 2: Fix next (shortly after launch)

### 2.1 SiteDataContext error handling

| Step | File | Action |
|------|------|--------|
| 1 | `src/SiteDataContext.tsx` | Add `error: string | null` to context state; in the `catch` of `refresh()`, set `error` to a message and keep `loading: false`. |
| 2 | Same | Expose `error` and a `retry` (e.g. call `refresh` again) from the context. |
| 3 | `src/PublicSite.tsx` or a top-level banner component | When `useSiteData().error` is set, show a small banner with "Failed to load content" and a Retry button that calls `refresh()`. |

---

### 2.2 Sitemap and robots.txt domain

| Step | File | Action |
|------|------|--------|
| 1 | `app/sitemap.ts` | Create dynamic sitemap using `APP_URL` or `process.env.VERCEL_URL` so the base URL is correct. Include `/`, `/contact`, `/portfolio`, `/packages`, and main booking routes. |
| 2 | `public/robots.txt` | Either keep static and document that for non-icube.ae deployments it must be updated, or serve robots via route handler that uses `APP_URL` for Sitemap line. |

---

### 2.3 Unify contact subject/area options

| Step | File | Action |
|------|------|--------|
| 1 | `src/constants/contact.ts` (new) or existing shared file | Define a single array of subject/area options (e.g. `CONTACT_SUBJECT_OPTIONS`). |
| 2 | `src/components/Contact.tsx` | Use that array for the subject `<select>`. |
| 3 | `src/ContactModalContext.tsx` | Replace local `AREAS_OF_INTEREST` with the same shared array. |

---

### 2.4 Add validation for contact and booking payloads

| Step | File | Action |
|------|------|--------|
| 1 | Project | Add Zod: `npm install zod`. |
| 2 | `src/schemas/contact.ts` (new) | Define `contactFormSchema` (name, email, subject, message with min/max length, email format). |
| 3 | `src/schemas/booking.ts` (new) | Define `bookingPayloadSchema` for the booking submission shape. |
| 4 | `src/api.ts` | Before writing to Firestore in `/contact` and `/booking`, parse and validate with the schema; throw or return 400 on failure. |
| 5 | Contact/booking forms | Optionally validate on client with the same schemas for immediate feedback. |

---

## Priority 3: Improve later

### 3.1 Use Next.js Image and fonts

| Step | File | Action |
|------|------|--------|
| 1 | `app/layout.tsx` or `globals.css` | Replace Google `@import` fonts with `next/font/google` (Inter, Outfit). |
| 2 | `src/components/Hero.tsx`, `Portfolio.tsx`, `Studio.tsx`, `Testimonials.tsx` | Replace `<img>` with `next/image` where appropriate; set `sizes` and `priority` for above-the-fold hero. |

---

### 3.2 Portfolio empty state

| Step | File | Action |
|------|------|--------|
| 1 | `src/components/Portfolio.tsx` | When `items.length === 0`, render a message (e.g. "No projects to show yet") and optional link to contact. |

---

### 3.3 Carousel aria-labels

| Step | File | Action |
|------|------|--------|
| 1 | `src/components/Services.tsx`, `Portfolio.tsx`, `Testimonials.tsx`, `Studio.tsx` | Add `aria-label="Previous slide"` / `"Next slide"` (or section-specific, e.g. "Previous testimonial") to carousel prev/next buttons. |

---

### 3.4 Firebase env graceful failure

| Step | File | Action |
|------|------|--------|
| 1 | `src/firebase.ts` | Instead of throwing when vars are missing, export a flag `isFirebaseConfigured` and let the app show a "Configure Firebase" message or redirect to a setup page when false. |

---

## Implementation status

- **Priority 1 (Critical):** ✅ Implemented.
  - 1.1 ProtectedRouteNext uses `usePathname()` and redirects to `from=<current path>`.
  - 1.2 Login shows admin hint only when `NODE_ENV === "development"`.
  - 1.3 Upload API requires header `x-upload-key` when `UPLOAD_API_KEY` or `NEXT_PUBLIC_UPLOAD_API_KEY` is set; client sends `NEXT_PUBLIC_UPLOAD_API_KEY` from `uploadCloudinary.ts`. If neither env is set, upload remains allowed (backward compatible).
  - 1.4 Footer links to `/privacy` and `/terms`; placeholder pages added at `app/privacy/page.tsx` and `app/terms/page.tsx`.
  - 1.5 Dashboard mobile nav: hamburger (sm:hidden), overlay, and sidebar slide-in; body scroll locked when open; nav closes on link click or overlay click.
- **Priority 2:** ✅ Implemented.
  - 2.1 SiteDataContext: added `error: string | null` and set it in `refresh()` catch; PublicSite shows a sticky retry banner when `error` is set.
  - 2.2 Dynamic sitemap: `app/sitemap.ts` with base URL from `APP_URL` or `VERCEL_URL`; `app/robots.ts` with dynamic Sitemap line. Removed static `public/sitemap.xml`.
  - 2.3 Unified contact options: `src/constants/contact.ts` with `CONTACT_SUBJECT_OPTIONS`; Contact.tsx and ContactModalContext use it.
  - 2.4 Zod validation: added `zod`; `src/schemas/contact.ts` and `src/schemas/booking.ts`; api.ts validates contact and booking payloads with safeParse and throws clear errors.
- **Priority 3:** ✅ Implemented.
  - 3.1 next/font: Inter and Outfit in `app/layout.tsx`; removed Google @import from globals.css. next/image: Hero (priority, fill), Portfolio (fill, sizes), Testimonials (48×48); `next.config.mjs` remotePatterns for Unsplash and Cloudinary.
  - 3.2 Portfolio: when `items.length === 0`, show “No projects to show yet” and “Get in touch” button.
  - 3.3 Carousel aria-labels: Services (“Previous/Next service”), Portfolio (“Previous/Next project”), Testimonials (“Previous/Next testimonial”), Studio (“Previous/Next studio”).
  - 3.4 Firebase: `isFirebaseConfigured`, `requireAuth()`, `requireFirestore()`, `requireStorage()`; no throw at load when vars missing; api, AuthContext, Login, Signup, DashboardHero use require*.

---

## Priority 4: تحسينات إضافية (باقي الخطة)

### 4.1 صور البورتفوليو من YouTube

| Step | File | Action |
|------|------|--------|
| 1 | `next.config.mjs` | Add `img.youtube.com` to `images.remotePatterns` so portfolio items with YouTube thumbnail URLs work with `next/image`. |

**Result:** No runtime error when `project.image_url` is a YouTube thumbnail.

### 4.2 تصحيح كتابة WhatsApp + إمكانية الوصول

| Step | File | Action |
|------|------|--------|
| 1 | `src/PublicSite.tsx` | Fix typo: "Whatsapp" → "WhatsApp" in the floating button label. |
| 2 | `app/globals.css` | Add `@media (prefers-reduced-motion: reduce)` to disable or minimize animations for users who prefer reduced motion. |

### 4.3 النشرة الإخبارية في الفوتر

| Step | File | Action |
|------|------|--------|
| 1 | `src/components/Footer.tsx` | When newsletter form is submitted, show short message: "Newsletter coming soon. Thanks for your interest." so users know it is not yet wired. |

### 4.4 رابط سياسة الخصوصية في نافذة Contact

| Step | File | Action |
|------|------|--------|
| 1 | `src/ContactModalContext.tsx` | Change Privacy Policy link from `/#contact` to `/privacy`. |

---

- **Priority 4:** ✅ Implemented.
  - 4.1 `next.config.mjs`: added `img.youtube.com` to `images.remotePatterns`.
  - 4.2 PublicSite: "WhatsApp" typo fixed; globals.css: `prefers-reduced-motion` media query added.
  - 4.3 Footer: "Newsletter coming soon. Thanks for your interest." shown after subscribe.
  - 4.4 ContactModalContext: Privacy Policy link now points to `/privacy`.

---

## Priority 5: تحسينات إضافية (تابع)

### 5.1 noindex للداشبورد

| Step | File | Action |
|------|------|--------|
| 1 | `app/dashboard/layout.tsx` | Convert to server component; export `metadata` with `robots: "noindex, nofollow"`. Move client tree to `DashboardLayoutClient.tsx`. |

### 5.2 تباعد زر "العودة للأعلى" وواتساب على الموبايل

| Step | File | Action |
|------|------|--------|
| 1 | `src/PublicSite.tsx` | On mobile use `bottom-24` for back-to-top so it sits above the WhatsApp pill; keep `bottom-36` on `sm:` and up. |

### 5.3 دالة مساعدة لأسماء المجموعات في api

| Step | File | Action |
|------|------|--------|
| 1 | `src/api.ts` | Add `dashboardKindToCollection(kind)` (packages→booking_packages, addons→booking_addons, why-us→why_us, studio-equipment→studio_equipment). Use it in PUT and DELETE path handlers. |

### 5.4 صفحة Videos في الداشبورد

| Step | File | Action |
|------|------|--------|
| 1 | `app/dashboard/videos/page.tsx` | Create page that renders `DashboardVideos`. |
| 2 | `src/views/DashboardLayoutNext.tsx` | Add nav item: `{ href: "/dashboard/videos", label: "Videos", icon: Video }`. |

---

- **Priority 5:** ✅ Implemented.
  - 5.1 Dashboard layout is server component with `robots: "noindex, nofollow"`; client tree in `DashboardLayoutClient.tsx`.
  - 5.2 Back-to-top: `bottom-24 sm:bottom-36` to reduce overlap with WhatsApp on small screens.
  - 5.3 `dashboardKindToCollection()` in api.ts; PUT/DELETE use it.
  - 5.4 `app/dashboard/videos/page.tsx` added; "Videos" link in dashboard nav.
