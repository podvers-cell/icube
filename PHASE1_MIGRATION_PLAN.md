# Phase 1 — Migration Analysis & Plan

**Project:** ICUBE Media Studio  
**Date:** Phase 1 audit  
**Scope:** Vite + React + TypeScript → Next.js App Router (current state analysis and migration plan)

---

## 1. Audit Summary

### Current runtime / build

- **Build:** **Next.js only.** `package.json` scripts are `dev: "next dev"`, `build: "next build"`, `start: "next start"`. No Vite scripts.
- **Dependencies:** No `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, or `react-router-dom` in `package.json`. The project has already been converted to a **pure Next.js (App Router)** setup per `FINAL_CLEANUP_SUMMARY.md`.
- **Vite artifacts:** **None in source.** No `vite.config.ts`, no `index.html`, no `src/main.tsx`. These were removed in a previous cleanup.
- **Routing:** **Next.js App Router only.** All routes live under `app/`; navigation uses `next/link` and `useRouter()` from `next/navigation`. No React Router usage in source.
- **Environment:** **Next.js only.** `src/firebase.ts` uses `process.env.NEXT_PUBLIC_FIREBASE_*`. No `VITE_*` or `import.meta.env` in application code. `.env.example` documents only `NEXT_PUBLIC_*` and server-only vars.

**Conclusion:** The codebase is **already a Next.js App Router project** with Vite and React Router removed. Remaining work is **cleanup, verification, and one config fix** (see below), not a full migration from scratch.

---

## 2. Vite-specific / legacy items

| Item | Status | Action |
|------|--------|--------|
| `vite.config.ts` | Absent | None |
| `index.html` | Absent | None |
| `src/main.tsx` | Absent | None |
| `src/App.tsx` | Absent | None |
| `src/index.css` | Absent | None (replaced by `app/globals.css`) |
| `src/vite-env.d.ts` | Absent | None |
| React Router | Not used in source | None |
| `VITE_*` / `import.meta.env` in app code | Not used | None |
| **vercel.json** | **Rewrite to `/index.html`** | **Fix:** Remove or replace rewrite (Next.js does not serve `index.html` for all routes). See Section 9. |
| **package-lock.json** | May still list Vite/react-router (e.g. transitive) | Optional: run `npm install` to align lockfile with current `package.json`. |

---

## 3. Routes / pages

All routes are implemented in the App Router. Mapping:

| URL | App Router file | View / content |
|-----|-----------------|----------------|
| `/` | `app/page.tsx` | `PublicSite` (home) |
| `/packages` | `app/packages/page.tsx` | `PackagesPage` |
| `/portfolio` | `app/portfolio/page.tsx` | `PortfolioPage` |
| `/contact` | `app/contact/page.tsx` | `ContactPage` |
| `/login` | `app/login/page.tsx` | `Login` |
| `/signup` | `app/signup/page.tsx` | `Signup` |
| `/dashboard` | `app/dashboard/page.tsx` | `DashboardOverview` |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | `DashboardSettings` |
| `/dashboard/hero` | `app/dashboard/hero/page.tsx` | `DashboardHero` |
| `/dashboard/services` | `app/dashboard/services/page.tsx` | `DashboardServices` |
| `/dashboard/portfolio` | `app/dashboard/portfolio/page.tsx` | `DashboardPortfolio` |
| `/dashboard/testimonials` | `app/dashboard/testimonials/page.tsx` | `DashboardTestimonials` |
| `/dashboard/packages` | `app/dashboard/packages/page.tsx` | `DashboardPackages` |
| `/dashboard/bookings` | `app/dashboard/bookings/page.tsx` | `DashboardBookings` |
| `/dashboard/messages` | `app/dashboard/messages/page.tsx` | `DashboardMessages` |
| `/dashboard/why-us` | `app/dashboard/why-us/page.tsx` | `DashboardWhyUs` |
| `/dashboard/studio` | `app/dashboard/studio/page.tsx` | `DashboardStudio` |
| `/dashboard/studios` | `app/dashboard/studios/page.tsx` | `DashboardStudios` |

No views are still wired via React Router; no new route mapping is required.

---

## 4. Shared / reusable components

All under `src/components/`:

- **Layout / shell:** `Navbar`, `Footer`, `WavySectionDivider`
- **Sections:** `Hero`, `Services`, `Studio`, `Portfolio`, `WhyIcube`, `Testimonials`, `Videos`, `Contact`, `Booking`, `BenefitsSection`
- **UI:** `VideoPlayerModal`, `UserProfile`, `Contact` (form + content)

Used by:

- `PublicSite` (home): Hero, Services, Studio, Portfolio, WhyIcube, Testimonials, Videos, Contact, BenefitsSection, Navbar, Footer
- Other pages: `PackagesPage` → Booking; `PortfolioPage` → Portfolio; `ContactPage` → Contact; etc.
- Dashboard: `DashboardLayoutNext` uses `UserProfile`; dashboard views use shared UI patterns.

Imports use `@/` (e.g. `@/components/...`, `@/views/...`). No change needed for “moving” components; structure is already Next-friendly.

---

## 5. Context providers and mounting

- **Providers:** `AuthProvider` (`AuthContext`), `SiteDataProvider` (`SiteDataContext`), `ContactModalProvider` (`ContactModalContext`).
- **Mounting:** All three are wrapped in `app/ClientProviders.tsx` (which has `"use client"`), and `app/layout.tsx` renders `<ClientProviders>{children}</ClientProviders>`.
- **Result:** App-wide client state and Firebase-dependent logic are correctly scoped to the client boundary. No change required for provider mounting.

---

## 6. Firebase

- **Init:** `src/firebase.ts` — initializes app, auth, firestore, storage using `process.env.NEXT_PUBLIC_FIREBASE_*`. Throws if any required value is missing.
- **Usage:** Only from client-side code: `AuthContext`, `api.ts` (Firestore/auth), dashboard views, Login/Signup. No server component imports `firebase.ts` or `api.ts`.
- **Auth:** `AuthContext` uses `onAuthStateChanged`; login/logout and protected routes work via `ProtectedRouteNext` and `useRouter()`.
- **Boundary:** Firebase is only imported in client components or in modules (e.g. `api.ts`) that are only ever imported by client components. No "use client" is required in `firebase.ts` for correctness; adding it would be optional for clarity.

No migration needed for Firebase beyond ensuring env vars are set in Vercel (see Section 13).

---

## 7. Browser-only and "use client"

- **Explicit "use client":** Used in `ClientProviders`, all dashboard layout/views, `PublicSite`, `AuthContext`, `SiteDataContext`, `ContactModalContext`, `ProtectedRouteNext`, and in components that use hooks/context: `Navbar`, `Footer`, `Contact`, `Booking`, `Portfolio`, `VideoPlayerModal`, `UserProfile`.
- **No "use client" but use hooks:** e.g. `Hero`, `Services`, `Studio`, `Testimonials`, `WhyIcube`, `Videos`, `BenefitsSection` — they use `useState`/`useEffect`/`useSiteData`. They are only ever rendered by `PublicSite` or other client views, so they run in client context. Adding `"use client"` to them is optional and can improve clarity and avoid accidental future use from a Server Component.
- **Browser globals:** Used only inside client components or inside code that is only imported from client components (e.g. `window` in `PublicSite`). No server-component code depends on browser-only globals.

No mandatory change; optional hardening: add `"use client"` to any component that uses hooks/context and is not already under a client boundary.

---

## 8. Server-incompatible code

- **Firebase / Firestore / Auth:** Used only from client (contexts, `api.ts`, views). Not imported by Server Components.
- **`api.ts`:** Uses Firebase and is only called from client (e.g. `SiteDataContext`, dashboard views, AuthContext). No server-side usage.
- **Hash / window:** `PublicSite` uses `window.location.hash` and `hashchange`; it is a client component. No issue.

No server-component imports of client-only modules were found. No change required for server compatibility.

---

## 9. Safest migration order and required fix

Because the app is already on Next.js App Router with Vite removed, “migration” is reduced to:

1. **Fix Vercel config (required)**  
   - **File:** `vercel.json`  
   - **Issue:** `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]` is an SPA/Vite-style rule. Next.js serves routes itself and does not use `index.html` for all paths. This rewrite can break or bypass Next routing.  
   - **Action:** Remove the `rewrites` array entirely so Vercel uses the default Next.js behavior. Keep `headers` if desired.

2. **Optional cleanup**  
   - Run `npm install` so `package-lock.json` matches `package.json` (removes or updates any stale Vite/react-router refs if present).  
   - Optionally add `"use client"` to components that use hooks but are only used from client (e.g. `Hero`, `Services`, `Studio`) for clarity and future safety.

3. **Verification**  
   - Run `npm run build` and fix any errors.  
   - Deploy to Vercel and smoke-test: `/`, `/packages`, `/portfolio`, `/contact`, `/login`, `/signup`, `/dashboard` and child routes.  
   - Confirm Firebase auth and dashboard behavior.

---

## 10. Files to create

- **None** for the migration. The App Router structure and providers already exist. Only `vercel.json` needs a change (no new file).

---

## 11. Files to modify

| File | Change |
|------|--------|
| **vercel.json** | Remove the `rewrites` entry that sends `/(.*)` to `/index.html`. Keep `headers` if you want to retain security headers. |

Optional (recommended for long-term clarity):

- **src/components/Hero.tsx** — Add `"use client";` at top (uses `useState`, `useEffect`, `useSiteData`).
- **src/components/Services.tsx** — Add `"use client";` (uses `useSiteData`).
- **src/components/Studio.tsx** — Add `"use client";` (uses hooks and context).
- **src/components/Testimonials.tsx** — Add `"use client";` if it uses hooks.
- **src/components/WhyIcube.tsx** — Add `"use client";` if it uses hooks.
- **src/components/Videos.tsx** — Add `"use client";` if it uses hooks.
- **src/components/BenefitsSection.tsx** — Add `"use client";` if it uses hooks.

(Only add where the component actually uses hooks or context.)

---

## 12. Files to delete

- **None.** Vite-specific files (`vite.config.ts`, `index.html`, `src/main.tsx`, etc.) are already removed. No further deletions are required for the migration.

---

## 13. Step-by-step plan (Phase 2 — execute safely)

1. **Backup / branch**  
   - Commit current state or create a branch before changing `vercel.json`.

2. **Fix vercel.json**  
   - Open `vercel.json`.  
   - Remove the `rewrites` array (or the single rule that sends to `/index.html`).  
   - Save. Example result:
     ```json
     {
       "headers": [
         {
           "source": "/(.*)",
           "headers": [
             { "key": "X-Content-Type-Options", "value": "nosniff" },
             { "key": "X-Frame-Options", "value": "DENY" },
             { "key": "X-XSS-Protection", "value": "1; mode=block" },
             { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
             { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
           ]
         }
       ]
     }
     ```

3. **Optional: add "use client"**  
   - Add `"use client";` to any shared component that uses hooks/context and is not already under a client parent, to avoid accidental Server Component usage later.

4. **Install and build**  
   - Run `npm install`.  
   - Run `npm run build`. Fix any build or type errors.

5. **Manual test**  
   - Run `npm run dev`. Test home, packages, portfolio, contact, login, signup, dashboard and children. Confirm auth and Firebase.

6. **Deploy**  
   - Push and deploy to Vercel. Re-test the same routes and auth.

7. **Env vars on Vercel**  
   - Ensure in Vercel project settings:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - If you use server features (e.g. Gemini): `GEMINI_API_KEY`, `APP_URL` as needed.

---

## 14. Final folder structure (current, post–Phase 1)

```
app/
  layout.tsx              # Root layout, globals.css, ClientProviders
  page.tsx                # Home → PublicSite
  globals.css
  ClientProviders.tsx
  packages/page.tsx
  portfolio/page.tsx
  contact/page.tsx
  login/page.tsx
  signup/page.tsx
  dashboard/
    layout.tsx            # ProtectedRouteNext, DashboardLayoutNext
    page.tsx
    settings/page.tsx
    hero/page.tsx
    services/page.tsx
    portfolio/page.tsx
    testimonials/page.tsx
    packages/page.tsx
    bookings/page.tsx
    messages/page.tsx
    why-us/page.tsx
    studio/page.tsx
    studios/page.tsx

src/
  AuthContext.tsx
  SiteDataContext.tsx
  ContactModalContext.tsx
  PublicSite.tsx
  firebase.ts
  api.ts
  ErrorBoundary.tsx
  components/             # Navbar, Footer, Hero, Services, Studio, etc.
  views/                  # *Page, Login, Signup, Dashboard*, ProtectedRouteNext, DashboardLayoutNext
  lib/                    # icons, videoEmbed, motion (if still used)
  (no main.tsx, App.tsx, or vite-env.d.ts)

public/                   # icube-logo.svg, robots.txt, sitemap.xml, podcast-still.png
server/                   # Express API (index.ts, db.ts, types.d.ts)
next.config.mjs
next-env.d.ts
tsconfig.json
package.json
vercel.json               # ← MODIFY: remove rewrites to /index.html
.env.example
```

---

## 15. Summary

- The project is **already a Next.js App Router application** with Vite and React Router removed.
- **Required change:** Update **vercel.json** to remove the rewrite to `/index.html`.
- **Optional:** Add `"use client"` to hook-using components used only from client; run `npm install` and re-verify build and deploy.
- **No new routes, no moving of views to App Router, no env var renames** — that work is done. Remaining work is configuration and verification for a production-safe, Vercel-ready Next.js app.

---

**End of Phase 1 — Migration Plan.**
