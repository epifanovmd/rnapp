/**
 * Чистая геометрия видимости панели: без reanimated, поэтому покрывается
 * юнит-тестами. Worklet-директива нужна для вызова с UI-потока.
 */

/** Смещение в допустимых пределах [0, height] */
export const clampOffset = (offset: number, height: number): number => {
  "worklet";

  return Math.min(Math.max(offset, 0), Math.max(height, 0));
};

/** Ближайшее состояние: скрыта, если пройдено больше половины высоты */
export const snapOffset = (offset: number, height: number): number => {
  "worklet";

  return offset > height / 2 ? height : 0;
};

/** Прогресс скрытия: 0 — панель показана, 1 — скрыта */
export const barProgress = (offset: number, height: number): number => {
  "worklet";

  if (height <= 0) {
    return 0;
  }

  return clampOffset(offset, height) / height;
};
