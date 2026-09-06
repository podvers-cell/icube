# تحسينات مقترحة — منظور Senior Full-Stack

مراجعة على مستوى البنية، الأداء، الأمان، والجودة. التوصيات مرتبة حسب الأولوية والتأثير.

---

## 1. الأمان (Security)

| # | التحسين | السبب | الإجراء المقترح |
|---|---------|--------|------------------|
| 1.1 | **عدم استخدام SESSION_SECRET افتراضي** | في `server/index.ts`: `process.env.SESSION_SECRET \|\| "icube-dubai-secret"` — في الإنتاج يجب ألا يكون هناك fallback. | في الإنتاج: إنهاء التشغيل إذا `!process.env.SESSION_SECRET`، أو استخدام مكتبة مثل `uuid` لتوليد سر عند البدء (مع تحذير في الـ log). |
| 1.2 | **تأمين رفع الملفات (Upload)** | `app/api/upload/route.ts` يعتمد على `UPLOAD_API_KEY` أو `NEXT_PUBLIC_UPLOAD_API_KEY`. المفتاح العام يُكشف في الـ client. | استخدام مفتاح سري فقط في السيرفر (`UPLOAD_API_KEY`). الـ client يرسل رمز مؤقت (مثلاً من session أو من endpoint يولد token مرة واحدة بعد تسجيل الدخول). |
| 1.3 | **عدم تسريب .env.local** | الملف يحتوي مفاتيح حساسة. | التأكد أن `.env*` في `.gitignore` وعدم رفع أي ملف env فيه قيم حقيقية. استخدام متغيرات البيئة في Vercel/Cloud Run فقط. |
| 1.4 | **CORS في Express** | `cors({ origin: true, credentials: true })` يسمح بأي أصل. | في الإنتاج: تقييد `origin` بقائمة نطاقات معروفة (مثل `APP_URL`). |

---

## 2. الأداء (Performance)

| # | التحسين | السبب | الإجراء المقترح |
|---|---------|--------|------------------|
| 2.1 | **تحميل بيانات الموقع على مراحل (Staged)** | `SiteDataContext` يجلب 9 طلبات معاً (`Promise.all`). على شبكة بطيئة، المستخدم ينتظر أبطأ طلب. | **المرحلة 1:** جلب `settings` فقط (للـ Hero، الـ maintenance، الـ Navbar). **المرحلة 2:** جلب الباقي (services, portfolio, studios, …). أو استخدام endpoint واحد مُجمّع في الـ backend يرد كل المحتوى في طلب واحد (تقليل round-trips). |
| 2.2 | **تخزين مؤقت للبيانات (Cache)** | كل زيارة تعيد جلب كل البيانات من Firestore. | استخدام **SWR** أو **React Query** مع `staleTime` (مثلاً 60 ثانية) حتى لا يُعاد الجلب في كل تنقل. أو cache في memory داخل `SiteDataContext` مع invalidation عند التحديث من الداشبورد. |
| 2.3 | **تحميل الداشبورد عند الحاجة** | الداشبورد (و Firebase) يُحمّل مع الصفحة الرئيسية إذا كان المستخدم يزور `/` أولاً. | التأكد أن `DashboardLayoutWrapper` يستخدم `dynamic(..., { ssr: false })` وأن مسارات `/dashboard/*` تُحمّل كـ chunks منفصلة. مراجعة bundle مع `next build` و `@next/bundle-analyzer`. |
| 2.4 | **صور الـ Hero** | على الموبايل قد تُحمّل صورة بدقة كاملة. | استخدام `sizes="(max-width: 768px) 100vw, 100vw"` (موجود تقريباً). إضافة `fetchPriority="high"` للصورة فوق الطية فقط. التأكد أن Cloudinary يُستخدم مع تحويلات بحجم مناسب للموبايل إن أمكن. |
| 2.5 | **خطوط Google** | `Inter` و `Outfit` يُحمّلان من Google. | الخطوط مُعدّة مع `display: "swap"` (جيد). يمكن تقليل الوزن بطلب subsets محددة فقط إن لم تكن تحتاج كل اللغات. |

---

## 3. المرونة والموثوقية (Resilience)

| # | التحسين | السبب | الإجراء المقترح |
|---|---------|--------|------------------|
| 3.1 | **Error Boundary على مستوى التطبيق** | `ErrorBoundary` موجود في `src/` لكن غير مستخدم في `app/layout.tsx`. | لف `ClientProviders` أو `children` داخل `<ErrorBoundary>` في الـ layout حتى أي خطأ في شجرة React لا يترك الصفحة بيضاء. |
| 3.2 | **صفحة خطأ عامة (error.tsx)** | Next.js يدعم `error.tsx` و `global-error.tsx`. | إضافة `app/error.tsx` (واختيارياً `app/global-error.tsx`) لعرض واجهة بديلة مع زر "إعادة المحاولة" بدلاً من الشاشة الافتراضية. |
| 3.3 | **إعادة المحاولة عند فشل تحميل البيانات** | عند فشل `SiteDataContext` يظهر الخطأ ولا توجد إعادة محاولة تلقائية. | عرض زر "إعادة المحاولة" في واجهة الخطأ واستدعاء `refresh()`. اختيارياً: retry تلقائي (مثلاً مرتين) قبل عرض الخطأ. |
| 3.4 | **معالجة انقطاع Firebase** | إذا انقطع الاتصال أو كانت قواعد الأمان ترفض الطلب، المستخدم يرى رسالة عامة. | تمييز أخطاء الشبكة عن أخطاء الصلاحيات وعرض رسائل واضحة. اختيارياً: وضع offline بسيط (عرض آخر بيانات محفوظة إن وُجدت). |

---

## 4. البنية والمصادر (Architecture & Data)

| # | التحسين | السبب | الإجراء المقترح |
|---|---------|--------|------------------|
| 4.1 | **مصدر واحد للبيانات** | يوجد **Firebase (Firestore)** في `src/api.ts` و **Express + SQLite** في `server/`. واجهة الموقع الحالية تعتمد على Firebase. | توثيق أي مصدر هو "مصدر الحقيقة" للإنتاج (Firebase أم SQLite). إذا كان الهدف تشغيل Express كـ API منفصل، توحيد استدعاءات الـ frontend لتذهب إلى Next.js API Routes أو إلى Express بشكل واضح، وعدم الاحتفاظ بمسارات مكررة. |
| 4.2 | **تحقق من المدخلات في API Routes** | routes مثل `send-booking-confirmation` و `send-contact-email` تقرأ الـ body. | استخدام Zod (أو غيره) لتحقق من الـ body في كل route وتجنب حقن أو بيانات غير متوقعة. |
| 4.3 | **تحديد أنواع الاستجابة** | بعض الدوال تُرجع `T` دون ربط واضح بين path ونوع الاستجابة. | تعريف أنواع محددة لكل endpoint (مثلاً `SiteSettings`, `Service[]`) وتصديرها من `api.ts` لاستخدامها في المكونات وتقليل الأخطاء. |

---

## 5. تجربة المستخدم والـ UX

| # | التحسين | السبب | الإجراء المقترح |
|---|---------|--------|------------------|
| 5.1 | **حالات التحميل (Loading)** | أقسام الموقع قد تظهر فجأة بعد جلب البيانات. | استخدام Skeleton أو placeholders متسقة (مثلاً في Hero، Services، Portfolio) بدلاً من عدم عرض شيء حتى اكتمال التحميل. |
| 5.2 | **الوصولية (a11y)** | الأزرار والروابط تحتاج تأكيد أن كل العناصر التفاعلية لها تسميات وتركيز لوحة المفاتيح. | مراجعة بصمة لوحة المفاتيح (Tab، Enter)، ووجود `aria-label` حيث لا يوجد نص مرئي، وعدم الاعتماد على اللون فقط للإشارة. |
| 5.3 | **رسائل الخطأ للمستخدم** | أخطاء مثل "Failed to load content" عامة. | تمييز رسائل للمستخدم (شبكة، صلاحيات، صيانة) وربطها بواجهة الخطأ أو الصيانة الموجودة. |

---

## 6. الجودة والصيانة (Code Quality)

| # | التحسين | السبب | الإجراء المقترح |
|---|---------|--------|------------------|
| 6.1 | **اختبارات آلية** | لا يبدو وجود اختبارات في `package.json`. | إضافة **Jest** أو **Vitest** مع **React Testing Library** لاختبار المكونات الحرجة (مثلاً النماذج، SiteDataContext، صفحة الحجز). البدء بـ 2–3 ملفات ذات أولوية عالية. |
| 6.2 | **Lint و Format** | وجود `tsc --noEmit` فقط. | إضافة **ESLint** مع قاعدة TypeScript واختيارياً **Prettier**، وتشغيلهما في الـ pre-commit أو CI. |
| 6.3 | **تجنب `any`** | في `api.ts` يوجد `body as any` في عدة أماكن. | استبدالها بأنواع محددة أو بـ Zod مع `z.infer<>` لربط التحقق بالأنواع. |
| 6.4 | **تسمية المشروع** | `package.json`: `"name": "react-example"`. | تغيير الاسم إلى اسم المشروع الفعلي (مثلاً `icube-media-studio`) لسهولة التعرف في الـ logs والنشر. |

---

## 7. DevOps والنشر

| # | التحسين | السبب | الإجراء المقترح |
|---|---------|--------|------------------|
| 7.1 | **التحقق من متغيرات البيئة عند البدء** | نقص متغير (مثل `RESEND_API_KEY`) يظهر فقط عند استدعاء الـ API. | إنشاء صفحة أو script تحقق (مثلاً في الداشبورد أو عند البناء) تتحقق من وجود المتغيرات المطلوبة وتُعلم الفريق. |
| 7.2 | **Rate limiting شامل** | الـ middleware يحدّ من upload و contact و booking email. | مراجعة إن كان يجب rate limit على مسارات أخرى (مثلاً قراءة بيانات الموقع إذا كانت تُستدعى من غير Next). عادة قراءة البيانات لا تحتاج حداً قوياً، لكن الـ POST يجب أن يبقى محدوداً. |
| 7.3 | **Health check** | للتأكد أن التطبيق يعمل في الـ orchestration (Kubernetes، Cloud Run). | إضافة route بسيط مثل `GET /api/health` يرد 200 (واختيارياً يتحقق من الاتصال بقاعدة البيانات أو Firebase). |

---

## 8. ملخص أولويات التنفيذ

- **عاجل (أمان):** 1.1 (SESSION_SECRET), 1.2 (تأمين الـ upload), 1.3 (عدم تسريب env).
- **قصير المدى (أداء ومرونة):** 2.1 (تحميل البيانات على مراحل), 3.1 (Error Boundary في الـ layout), 3.3 (إعادة المحاولة للبيانات).
- **متوسط المدى:** 2.2 (Cache), 4.1 (توحيد مصدر البيانات), 6.1 (اختبارات), 6.3 (إزالة any).
- **طويل المدى:** 6.1 توسيع الاختبارات، 5.2 (الوصولية)، 7.1 (التحقق من البيئة).

تم إعداد القائمة بناءً على مراجعة الكود الحالي؛ يمكن تعديل الأولويات حسب وقت الفريق وأهداف الإطلاق.

---

## 9. ما تم تنفيذه (تم التنفيذ بالترتيب)

| # | التحسين | الملفات المُعدّلة |
|---|---------|---------------------|
| 1.1 | SESSION_SECRET مطلوب في الإنتاج | `server/index.ts` |
| 1.2 | Upload: في الإنتاج مفتاح سري فقط، 503 إن لم يُضبط | `app/api/upload/route.ts` |
| 1.3 | .gitignore يمنع تسريب .env | كان مضبوطاً مسبقاً |
| 1.4 | CORS في Express مقيد بـ APP_URL في الإنتاج | `server/index.ts` |
| 3.1 | Error Boundary يلف التطبيق | `app/ClientProviders.tsx` |
| 3.2 | صفحة خطأ Next.js | `app/error.tsx` (جديد) |
| 3.3 | إعادة محاولة تلقائية (مرتين) + زر Retry | `src/SiteDataContext.tsx` |
| 2.1 | تحميل البيانات على مراحل (settings ثم الباقي) | `src/SiteDataContext.tsx` |
| 2.2 | كاش في الذاكرة (دقيقة واحدة) | `src/SiteDataContext.tsx` |
| 6.4 | تسمية المشروع | `package.json` → `icube-media-studio` |
| 7.3 | Health check | `app/api/health/route.ts` (جديد) |
| 6.3 | تقليل استخدام `any` في api | `src/api.ts` |

---

## 10. تحسينات إضافية (لم تُنفَّذ بعد)

هذه نقاط إضافية يمكن تنفيذها لاحقاً، مرتّبة حسب الفائدة والجهد.

### أ. لم يُنفَّذ من القائمة الأصلية

| # | التحسين | الجهد | ملاحظة |
|---|---------|-------|--------|
| 4.1 | **توثيق مصدر البيانات** | منخفض | توثيق في README أو ARCHITECTURE.md: هل الإنتاج يعتمد على Firebase أم Express/SQLite، وكيفية تشغيل كل واحد. |
| 4.2 | **تحقق Zod في API Routes** | منخفض | مسارات الإيميل (contact، booking) تستخدم Zod فعلاً؛ مراجعة أي route آخر يقرأ body وإضافة تحقق إن لزم. |
| 5.1 | **Skeleton / حالات تحميل** | متوسط | إضافة مكوّنات Skeleton لأقسام الصفحة الرئيسية (Services، Portfolio، Studio) حتى لا تظهر فجأة. |
| 5.2 | **الوصولية (a11y)** | متوسط | مراجعة تركيز لوحة المفاتيح، aria-label للأزرار بدون نص، وعدم الاعتماد على اللون فقط. |
| 5.3 | **رسائل خطأ أوضح** | منخفض | تمييز "شبكة" / "صلاحيات" / "صيانة" في SiteDataContext وعرض رسالة مناسبة للمستخدم. |
| 6.1 | **اختبارات (Jest/Vitest + RTL)** | مرتفع | إضافة إعداد الاختبارات و 2–3 اختبارات للمكوّنات أو الـ flows الحرجة. |
| 6.2 | **ESLint + Prettier** | منخفض | إضافة ESLint مع TypeScript واختيارياً Prettier، وتشغيلهما في الـ pre-commit أو CI. |
| 7.1 | **التحقق من متغيرات البيئة** | منخفض | صفحة في الداشبورد أو script يتحقق من وجود RESEND_API_KEY، Firebase، Cloudinary، وغيرها ويعرض تحذيراً. |
| 7.2 | **مراجعة Rate limiting** | منخفض | التأكد أن كل الـ POST الحساسة مغطاة في middleware (upload، contact، booking emails). |
| 2.3 | **تحميل الداشبورد عند الحاجة** | منخفض | التأكد أن `dynamic(..., { ssr: false })` للداشبورد وأن مسارات /dashboard تُحمّل كـ chunks منفصلة. |
| 2.4 | **صور Hero: fetchPriority** | منخفض | إضافة `fetchPriority="high"` لصورة الخلفية في Hero إن وُجدت. |
| 3.4 | **معالجة أخطاء Firebase** | متوسط | تمييز أخطاء الشبكة عن الصلاحيات وعرض رسالة مناسبة؛ اختياري: عرض آخر بيانات محفوظة عند انقطاع. |

### ب. تحسينات إضافية عملية

| # | التحسين | الفائدة | الإجراء المقترح |
|---|---------|---------|------------------|
| **B1** | **SEO: Open Graph و Twitter** | مشاركة أفضل على السوشيال | إضافة `openGraph` و `twitter` إلى `metadata` في `app/layout.tsx` (والصفحات المهمة) مع صورة افتراضية ووصف. |
| **B2** | **Security headers** | حماية إضافية في المتصفح | في `next.config.mjs` إضافة `headers()` مع X-Frame-Options، X-Content-Type-Options، Referrer-Policy. |
| **B3** | **صفحة global-error.tsx** | خطأ يغطي حتى أخطاء الـ layout | إضافة `app/global-error.tsx` للتعامل مع أخطاء في الـ root layout (واجهة بسيطة + زر إعادة تحميل). |
| **B4** | **إبطال الكاش عند التحديث من الداشبورد** | بيانات محدّثة بعد التعديل | عند حفظ أي محتوى من الداشبورد (settings، portfolio، إلخ) استدعاء دالة تُبطِل الكاش في SiteDataContext (مثلاً تصدير `invalidateSiteCache()` واستدعاؤها بعد الحفظ). |
| **B5** | **تحليل حجم الـ bundle** | تقليل حجم التحميل الأولي | إضافة `@next/bundle-analyzer` وتشغيله مع `next build` لمرة واحدة لرصد الصفحات/المكتبات الأثقل. |
| **B6** | **تحسين صور Cloudinary في next.config** | صور أخف على الموبايل | إضافة `deviceSizes` و `imageSizes` إن لزم؛ أو استخدام Cloudinary مع query params للحجم (مثلاً w=800 للموبايل) في مصدر الصورة. |

### ج. أولوية مقترحة للتنفيذ لاحقاً

1. **سريعة ومنخفضة الجهد:** B1 (SEO)، B2 (headers)، 2.4 (fetchPriority)، 6.2 (ESLint)، 7.2 (مراجعة rate limit).
2. **متوسطة:** 5.1 (Skeletons)، 5.3 (رسائل خطأ)، B4 (إبطال الكاش)، B3 (global-error).
3. **أعلى جهد:** 6.1 (اختبارات)، 5.2 (a11y)، 3.4 (أخطاء Firebase)، B5 (bundle analyzer).

---

## 11. ما تم تنفيذه في المرحلتين الإضافيتين

### المرحلة 1 (سريعة)
| التحسين | الملفات |
|---------|---------|
| B1 SEO (Open Graph + Twitter) | `app/layout.tsx` — openGraph, twitter, title template |
| B2 Security headers | `next.config.mjs` — X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| 2.4 fetchPriority لصورة Hero | `src/components/Hero.tsx` |
| 6.2 ESLint | `eslint.config.mjs`, `.eslintrc.json`, `package.json` (lint:eslint, lint:fix) — ESLint 9 flat config لـ app و src |

### المرحلة 2 (متوسطة)
| التحسين | الملفات |
|---------|---------|
| B3 global-error.tsx | `app/global-error.tsx` (جديد) |
| 5.3 رسائل خطأ أوضح | `src/lib/errorMessages.ts` — toUserFriendlyError()؛ استخدامها في SiteDataContext |
| B4 إبطال الكاش من الداشبورد | `src/SiteDataContext.tsx` — invalidateSiteCache()؛ استدعاؤها + refresh() في DashboardSettings، DashboardHero، DashboardBenefits، DashboardPortfolio |
| 5.1 Skeleton تحميل | `src/components/SectionSkeleton.tsx` (جديد)، `src/components/Services.tsx` — عرض skeleton عند loading وعدم وجود services |

---

## 12. ما تم تنفيذه في المرحلة الثالثة

| التحسين | الملفات / الإجراء |
|---------|-------------------|
| **B5 تحليل الـ bundle** | `@next/bundle-analyzer` في `next.config.mjs` (عند `ANALYZE=true`)؛ سكربت `build:analyze` مع `--webpack`؛ إضافة `analyze/` إلى `.gitignore`. التشغيل: `npm run build:analyze`. |
| **5.2 الوصولية (a11y)** | `app/globals.css` — تنسيقات `focus-visible` للأزرار والروابط والمدخلات؛ إضافة `aria-label` و`aria-pressed` في Videos، Portfolio (فلاتر)، Studio (تفاصيل الاستوديو، زر الحجز). |
| **3.4 معالجة أخطاء Firebase** | `src/lib/errorMessages.ts` — توسيع toUserFriendlyError (شبكة، صلاحيات، auth، unavailable)؛ دالة isNetworkError؛ عند فشل التحميل بسبب الشبكة وعند وجود كاش، عرض المحتوى المحفوظ مع رسالة "You're seeing saved content…". |
| **6.1 اختبارات** | إضافة Vitest و@testing-library/react وjsdom؛ `vitest.config.ts`، `vitest.setup.ts`؛ سكربتات `test` و `test:run`؛ اختبارات لـ SectionSkeleton و errorMessages (toUserFriendlyError، isNetworkError). |
