# خطة تنفيذ التحسينات – ICUBE Media Studio

ترتيب تنفيذ المقترحات واحداً تلو الآخر.

---

## ترتيب المهام

| # | المهمة | الحالة | الملاحظات |
|---|--------|--------|-----------|
| 1 | Open Graph + Canonical لجميع الصفحات العامة | ✅ | metadataBase في layout + openGraph و canonical و twitter لـ 11 صفحة |
| 2 | prefers-reduced-motion في CSS | ✅ | تعليق توضيحي؛ القواعد كانت موجودة مسبقاً |
| 3 | aria-label لأزرار الكراسي | ✅ | كانت موجودة مسبقاً (Previous/Next service, project, testimonial, studio) |
| 4 | مكون Toast موحّد + استخدامه في Contact | ✅ | ToastContext + ToastProvider + استخدام في Contact (نجاح/خطأ) |
| 5 | مؤشر تقدم في صفحات الحجز | ✅ | BookingProgress في 6 صفحات (Studio + Packages: date-time, add-ons, checkout) |
| 6 | حالة تحميل أوضح للداشبورد | ✅ | لوجو + سبينر + نص "Loading…" في ProtectedRouteNext |
| 7 | aria-live لحالات التحميل | ✅ | aria-live في ProtectedRouteNext ونسخة السبلاش في PublicSite |

---

## المهام المكتملة (المرحلة الثانية)

| # | المهمة | الحالة |
|---|--------|--------|
| 8 | Rate limiting (middleware) | ✅ ٥ طلبات/دقيقة للتواصل، ٢٠ للرفع، ١٠ لإيميل الحجز |
| 9 | Focus trap في المودالات | ✅ ContactModal، Studio، VideoPlayerModal عبر useFocusTrap |
| 10 | Code splitting للداشبورد | ✅ dynamic import لـ DashboardLayoutClient مع شاشة تحميل |
| 11 | JSON-LD (Organization / LocalBusiness) | ✅ في root layout مع اسم، وصف، عنوان، تواصل |

## المهام اللاحقة

- Swipe للكراسي على الموبايل

---

**آخر تحديث:** يحدَّث مع كل مهمة مكتملة.
