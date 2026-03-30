"use client";

import { useCallback, useRef } from "react";

const SWIPE_THRESHOLD_PX = 50;

/**
 * Touch swipe handlers for mobile carousels.
 * Swipe left → next, swipe right → prev.
 */
export function useSwipeCarousel(goPrev: () => void, goNext: () => void) {
  const touchStartX = useRef<number>(0);
  const ignoreSwipe = useRef<boolean>(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? 0;
    const target = e.target as HTMLElement | null;
    // If the gesture starts on an interactive control, don't treat it as a carousel swipe.
    ignoreSwipe.current = Boolean(
      target?.closest?.('button, input, textarea, select, [data-swipe-ignore="true"]')
    );
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (ignoreSwipe.current) {
        ignoreSwipe.current = false;
        return;
      }
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const delta = touchStartX.current - endX;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      if (delta > 0) goNext();
      else goPrev();
    },
    [goPrev, goNext]
  );

  return { onTouchStart, onTouchEnd };
}
