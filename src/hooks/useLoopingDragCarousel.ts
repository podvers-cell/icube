"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, useDragControls, useMotionValue } from "motion/react";

type Options = {
  /** Swipe distance threshold as a fraction of container width. */
  swipeThreshold?: number;
  /** Swipe velocity threshold in px/s. */
  velocityThreshold?: number;
};

export function useLoopingDragCarousel(len: number, opts?: Options) {
  const swipeThreshold = opts?.swipeThreshold ?? 0.2;
  const velocityThreshold = opts?.velocityThreshold ?? 700;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const controls = useDragControls();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [width, setWidth] = useState(0);

  // Track position: prev | current | next (each = container width)
  const x = useMotionValue(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.getBoundingClientRect().width);
      setWidth(w);
    });
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  // Ensure the track is centered on the current slide when width changes.
  useEffect(() => {
    if (!width) return;
    x.set(-width);
  }, [width, x]);

  const logicalIndex = useMemo(() => (len ? ((index % len) + len) % len : 0), [index, len]);
  const prevIndex = useMemo(() => (len ? (logicalIndex - 1 + len) % len : 0), [logicalIndex, len]);
  const nextIndex = useMemo(() => (len ? (logicalIndex + 1) % len : 0), [logicalIndex, len]);

  const goTo = useCallback(
    (target: number) => {
      if (!len) return;
      const next = ((target % len) + len) % len;
      setDirection(next > logicalIndex ? 1 : -1);
      setIndex(next);
      if (width) x.set(-width);
    },
    [len, logicalIndex, width, x]
  );

  const snapBack = useCallback(() => {
    if (!width) return;
    animate(x, -width, { type: "spring", stiffness: 420, damping: 42, mass: 0.9 });
  }, [width, x]);

  const commitPrev = useCallback(() => {
    if (!len || !width) return;
    setDirection(-1);
    animate(x, 0, {
      type: "spring",
      stiffness: 420,
      damping: 42,
      mass: 0.9,
      onComplete: () => {
        setIndex((i) => (i - 1 + len) % len);
        x.set(-width);
      },
    });
  }, [len, width, x]);

  const commitNext = useCallback(() => {
    if (!len || !width) return;
    setDirection(1);
    animate(x, -2 * width, {
      type: "spring",
      stiffness: 420,
      damping: 42,
      mass: 0.9,
      onComplete: () => {
        setIndex((i) => (i + 1) % len);
        x.set(-width);
      },
    });
  }, [len, width, x]);

  const onDragEnd = useCallback(
    (_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (!width || !len) return;
      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;
      const dist = width * swipeThreshold;
      const shouldNext = offsetX < -dist || velocityX < -velocityThreshold;
      const shouldPrev = offsetX > dist || velocityX > velocityThreshold;
      if (shouldNext) commitNext();
      else if (shouldPrev) commitPrev();
      else snapBack();
    },
    [width, len, swipeThreshold, velocityThreshold, commitNext, commitPrev, snapBack]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const isInteractive = Boolean(
        target?.closest?.('button, input, textarea, select, [data-swipe-ignore="true"]')
      );
      if (isInteractive) return;
      controls.start(e);
    },
    [controls]
  );

  const dragConstraints = useMemo(() => {
    if (!width) return { left: 0, right: 0 };
    return { left: -2 * width, right: 0 };
  }, [width]);

  return {
    containerRef,
    controls,
    x,
    width,
    index: logicalIndex,
    rawIndex: index,
    direction,
    prevIndex,
    nextIndex,
    setIndex: goTo,
    commitPrev,
    commitNext,
    onDragEnd,
    onPointerDown,
    dragConstraints,
  };
}

