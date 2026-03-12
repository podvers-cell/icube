"use client";

type Props = {
  currentStep: number;
  steps: string[];
  className?: string;
};

export default function BookingProgress({ currentStep, steps, className = "" }: Props) {
  return (
    <nav
      className={`flex items-center justify-center gap-2 sm:gap-4 py-4 mb-6 ${className}`}
      aria-label="Booking progress"
    >
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = currentStep === stepNum;
        const isPast = currentStep > stepNum;
        return (
          <div key={stepNum} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-icube-gold text-icube-dark"
                    : isPast
                      ? "bg-icube-gold/30 text-icube-gold"
                      : "bg-white/10 text-gray-400"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {isPast ? "✓" : stepNum}
              </span>
              <span
                className={`hidden sm:block text-xs font-medium max-w-[5rem] text-center truncate ${
                  isActive ? "text-white" : isPast ? "text-icube-gold/90" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 sm:mx-2 w-6 sm:w-12 h-0.5 rounded ${
                  isPast ? "bg-icube-gold/50" : "bg-white/10"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
