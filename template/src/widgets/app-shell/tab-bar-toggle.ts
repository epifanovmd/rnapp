/** Решение toggle-накопления: скрыть, показать или ничего не делать */
export type TTabBarToggle = "hide" | "show" | "none";

export interface ITabBarToggleResult {
  /** Накопленная дистанция для следующего тика */
  accumulated: number;
  command: TTabBarToggle;
}

/**
 * Таб-панель переключается после накопления threshold в одну сторону —
 * защита от дребезга на микродвижениях; смена направления копит заново.
 * Чистая функция, поэтому покрыта тестами; worklet — вызов с UI-потока.
 */
export const accumulateToggle = (
  accumulated: number,
  delta: number,
  threshold: number,
): ITabBarToggleResult => {
  "worklet";

  const sameDirection = accumulated * delta >= 0;
  const next = sameDirection ? accumulated + delta : delta;

  if (next > threshold) {
    return { accumulated: next, command: "hide" };
  }

  if (next < -threshold) {
    return { accumulated: next, command: "show" };
  }

  return { accumulated: next, command: "none" };
};
