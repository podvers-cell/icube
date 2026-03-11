/**
 * فاصل متموّج: لون الويف = لون السيكشن اللي أسفل، تقاطع متموّج فقط بدون تدرج أو خطوط.
 */
export default function WavySectionDivider() {
  return (
    <div
      className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none"
      style={{ height: "56px" }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1200 56"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <path
          d="M0,56 L0,28 Q200,8 400,28 Q600,48 800,28 Q1000,8 1200,28 L1200,56 Z"
          fill="var(--color-icube-dark)"
        />
      </svg>
    </div>
  );
}
