/** Easy ease – كل الأنيميشن في الموقع تستخدم هذا المنحنى لحركة سلسة */
export const EASY_EASE = [0.4, 0, 0.2, 1] as const;

export const viewportTransition = {
  duration: 0.5,
  ease: EASY_EASE,
};

export const hoverTransition = {
  duration: 0.3,
  ease: EASY_EASE,
};
