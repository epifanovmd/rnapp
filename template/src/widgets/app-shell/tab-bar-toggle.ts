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

  // После команды копится заново: иначе каждый следующий кадр в ту же
  // сторону повторял бы её (и перезапускал анимацию панели).
  if (next > threshold) {
    return { accumulated: 0, command: "hide" };
  }

  if (next < -threshold) {
    return { accumulated: 0, command: "show" };
  }

  return { accumulated: next, command: "none" };
};
