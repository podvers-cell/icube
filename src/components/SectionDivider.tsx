/**
 * خط فاصل رفيع ذهبي بين الأقسام (1px لضمان الظهور على كل الشاشات)
 */
export default function SectionDivider() {
  return (
    <div className="w-full h-px min-h-px shrink-0 bg-icube-gold/40" aria-hidden />
  );
}
