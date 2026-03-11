# Phase 0 — Migration Audit: Vite + React → Next.js App Router

## 1. Current Project Snapshot

### 1.1 Stack
- **Runtime:** React 19, TypeScript 5.8
- **Build:** Vite 6
- **Styling:** Tailwind CSS 4 (`@tailwindcss/vite`, `@theme` in CSS)
- **Routing:** react-router-dom v7 (declarative Routes)
- **Data/Auth:** Firebase (Auth + Firestore) from client only
- **State:** React Context (Auth, SiteData, ContactModal)

### 1.2 Route Map (Current)

| Route | Type | Component | Wrappers |
|-------|------|-----------|----------|
| `/` | Public | PublicSite (home) | SiteDataProvider |
| `/packages` | Public | PackagesPage | SiteDataProvider, ContactModalProvider |
| `/portfolio` | Public | PortfolioPage | SiteDataProvider, ContactModalProvider |
| `/login` | Auth | Login | — |
| `/signup` | Auth | Signup | — |
| `/dashboard` | Protected | DashboardLayout (Outlet) | ProtectedRoute, AuthProvider |
| `/dashboard/*` | Protected | DashboardOverview, Settings, Hero, … | same |
| `*` (catch-all) | Public | PublicSite | SiteDataProvider |

### 1.3 Public Marketing Pages (Migrate First)
- **Home:** `PublicSite` → Hero, Services, Studio, Portfolio (6), WhyIcube, BenefitsSection, Testimonials, Videos, Contact + Navbar, Footer, splash, WhatsApp, back-to-top.
- **Packages:** `PackagesPage` → Navbar, Booking, Footer.
- **Portfolio:** `PortfolioPage` → Navbar, Portfolio (full “Our work”), Footer.
- **Contact:** Section inside PublicSite + ContactModal (popup); no standalone `/contact` page.

### 1.4 Dashboard / Admin (Migrate After Public)
- **Layout:** DashboardLayout (sidebar + Outlet).
- **Pages:** Overview, Settings, Hero, Services, Portfolio, Testimonials, Packages, Bookings, Messages, Why Us, Studio, Studios.
- **Auth:** ProtectedRoute (redirect to /login if no user, to / if not admin).

### 1.5 Shared Components (Need "use client" or Stay Server)

| Component | Needs "use client" | Reason |
|-----------|---------------------|--------|
| Navbar | Yes | useState, useEffect, useAuth, useContactModal, useNavigate |
| Footer | Yes | useState (newsletter), useContactModal |
| Hero | Yes | useState, motion, useSiteData |
| Services | Yes | motion, useSiteData |
| Studio | Yes | useState, motion, useSiteData |
| Portfolio | Yes | useState, motion, useSiteData, useContactModal |
| WhyIcube | Yes | motion, useSiteData |
| BenefitsSection | Yes | motion, useSiteData |
| Testimonials | Yes | motion, useSiteData |
| Videos | Yes | useState, motion, useSiteData |
| Contact | Yes | useState, motion, useSiteData |
| Booking | Yes | useState, useSiteData |
| WavySectionDivider | No | Pure presentational |
| VideoPlayerModal | Yes | useState/callbacks |
| BenefitsSection | Yes | motion |
| PublicSite | Yes | useState, useEffect, useLocation, useSiteData |
| AuthContext | Yes | useState, useEffect, Firebase Auth |
| SiteDataContext | Yes | useState, useEffect, Firebase Firestore |
| ContactModalContext | Yes | useState, modal state |
| ErrorBoundary | No | Class component (no hooks) |

### 1.6 Firebase Usage
- **firebase.ts:** Initializes app with `import.meta.env.VITE_FIREBASE_*` → must become `process.env.NEXT_PUBLIC_*` for client in Next.js.
- **api.ts:** All Firestore/Auth calls from client; no server-side Firebase in current app. Keep client-only for migration; no API routes required initially.
- **AuthContext:** onAuthStateChanged, getDoc(admins) — client.
- **SiteDataContext:** getDocs for all collections — client.

### 1.7 Global CSS (index.css)
- `@import url(...)` Google Fonts.
- `@import "tailwindcss"` + `@theme { ... }` (Tailwind 4).
- Custom selectors: html, body, #root, scrollbar, focus, .card-flip-*, .section-*, .whatsapp-*.
- **Next:** Use `app/globals.css`; replace `#root` with body or layout wrapper; keep Tailwind 4 + @theme if Next 15 supports it, or mirror theme in tailwind.config.

### 1.8 Assets
- **public/:** icube-logo.svg, podcast-still.png, robots.txt, sitemap.xml.
- **Images:** Mostly external URLs (Unsplash) and Firebase storage URLs; some `<img>` with `/icube-logo.svg`. next/image can be used later for static assets; minimal change for first pass.

### 1.9 Dependencies to Remove After Migration
- `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`
- `react-router-dom`
- (Optional later) `lazy` usage from React — Next.js has its own code-splitting.

### 1.10 Dependencies to Add
- `next` (15.x)
- Tailwind: Keep `tailwindcss`; use PostCSS + `tailwindcss/postcss` or Next’s Tailwind 4 support per docs.

---

## 2. File-by-File Migration Plan

| Current path | Next.js / Action |
|--------------|------------------|
| index.html | Replaced by app/layout.tsx + metadata; no standalone HTML. |
| src/main.tsx | Removed; Next bootstraps from app/layout. |
| src/App.tsx | Removed; routing is file-based. |
| src/index.css | → app/globals.css (adapt @theme and selectors). |
| src/PublicSite.tsx | → app/page.tsx (default home) + client wrapper. |
| src/views/PackagesPage.tsx | → app/packages/page.tsx. (Phase 1: folder renamed pages→views) |
| src/views/PortfolioPage.tsx | → app/portfolio/page.tsx. |
| src/views/Login.tsx | → app/login/page.tsx. |
| src/views/Signup.tsx | → app/signup/page.tsx. |
| src/views/ProtectedRoute.tsx | → middleware or HOC for /dashboard. |
| src/views/DashboardLayout.tsx | → app/dashboard/layout.tsx (Outlet → children). |
| src/views/Dashboard*.tsx | → app/dashboard/[section]/page.tsx or single layout + segment. |
| src/components/* | Move to components/ (or keep src/components); add "use client" where needed. |
| src/contexts (Auth, SiteData, ContactModal) | Keep; add "use client"; wrap in layout or providers. |
| src/firebase.ts | Keep; env: VITE_* → NEXT_PUBLIC_*. |
| src/api.ts | Keep; no change for client-only Firebase. |
| src/ErrorBoundary.tsx | Keep; use in layout or root. |
| src/lib/* | Keep; no router dependency. |
| vite.config.ts | Remove after next.config.mjs works. |
| tsconfig.json | Extend for Next (compilerOptions for Next, include app/). |

---

## 3. Risks and Blockers

1. **Tailwind 4:** Next 15 can use Tailwind 4 with `@import "tailwindcss"` in globals.css; ensure PostCSS/configuration matches. Fallback: use Tailwind 3 with same theme variables in tailwind.config.
2. **Firebase env:** `import.meta.env.VITE_*` must become `process.env.NEXT_PUBLIC_*` and be set in .env.local.
3. **Hash routing:** Links like `/#services`, `/#contact` work with next/link (client-side); ensure scroll behavior is preserved.
4. **ProtectedRoute:** Next has no Navigate component; use `redirect()` from next/navigation in a client check or middleware. Middleware can only verify tokens if we use cookies; current app uses Firebase client state, so protected layout with client-side redirect is acceptable for Phase 5.
5. **Motion (framer-motion successor):** Works in client components; no change.
6. **Server/Express:** Unused by current React app; leave server/ as-is or remove later; do not mix with Next API routes in Phase 1.

---

## 4. Migration Phases Summary

| Phase | Scope | Deliverable |
|-------|--------|--------------|
| **1** | Next.js foundation | app/layout, app/page (home shell), globals.css, next.config, tsconfig; remove Vite entry. |
| **2** | Public site | app/page (full home), app/packages, app/portfolio; next/link, next/navigation; metadata. |
| **3** | Shared structure | Navbar, Footer, providers; "use client" on all client components. |
| **4** | Firebase | Env rename to NEXT_PUBLIC_*; firebase.ts and api.ts working in client components. |
| **5** | Dashboard | app/dashboard layout + pages; ProtectedRoute → client redirect or middleware. |
| **6** | Cleanup | Remove Vite, react-router; optional dependency cleanup; final summary. |

---

## 5. "use client" Checklist

- **Root layout (app/layout.tsx):** Server by default; only wrap children with providers that are client (Auth, SiteData, ContactModal).
- **Providers:** AuthContext, SiteDataContext, ContactModalContext → "use client".
- **PublicSite / Home:** Client (state, useEffect, useLocation → usePathname/hash).
- **Navbar, Footer:** Client.
- **All section components (Hero, Services, …):** Client (motion or hooks).
- **PackagesPage, PortfolioPage:** Can be server page that imports client Booking/Portfolio; for minimal change, mark page as client or wrap content in client component.
- **Login, Signup:** Client (forms, navigate).
- **Dashboard layout + all dashboard pages:** Client (auth, api, state).
- **ErrorBoundary:** Class component; no directive needed; use in client tree.

---

*End of Phase 0 audit.*

---

## 6. Phase 1 Completed (Implementation)

- **Next.js foundation:** `next.config.mjs`, `postcss.config.mjs` (Tailwind 4), `next-env.d.ts`, `tsconfig.json` updated for Next (paths `@/*` → `./src/*`, exclude `server/`).
- **app/:** `app/layout.tsx` (root layout, metadata), `app/globals.css` (migrated from `src/index.css`, no `#root`), `app/page.tsx` (placeholder home).
- **Critical rename:** `src/pages` → `src/views` so Next.js does not treat it as Pages Router. All imports in `src/App.tsx` updated to `./views/`.
- **Fixes:** `VideoPlayerModal.tsx` Window type for Vimeo; `SiteDataContext.tsx` Studio type `images` optional; `@types/react` / `@types/react-dom` added; `allowImportingTsExtensions` kept for Vite compatibility.
- **Builds:** `npm run build:next` and `npm run build` (Vite) both succeed. Vite entry (`index.html`, `src/main.tsx`, `src/App.tsx`) unchanged.
- **Remaining:** Phase 2 (public routes), Phase 3 (shared layout/providers), Phase 4 (Firebase env), Phase 5 (dashboard), Phase 6 (cleanup).
