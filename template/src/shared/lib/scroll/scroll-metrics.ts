import { TScrollDirection } from "./scroll.types";

/**
 * Чистые вычисления по scroll-событию: без reanimated и RN, поэтому
 * покрываются юнит-тестами. Worklet-директива нужна для вызова с UI-потока.
 */

/** Направление по приращению офсетов; без движения сохраняется предыдущее */
export const resolveDirection = (
  offsetX: number,
  offsetY: number,
  prevX: number,
  prevY: number,
  prev: TScrollDirection,
): TScrollDirection => {
  "worklet";

  if (offsetY !== prevY) {
    return offsetY > prevY ? "down" : "up";
  }

  if (offsetX !== prevX) {
    return offsetX > prevX ? "right" : "left";
  }

  return prev;
};

/** Максимальный офсет: контент минус видимая область, ≥ 0 */
export const resolveMaxOffset = (
  contentSize: number,
  layoutSize: number,
): number => {
  "worklet";

  return Math.max(0, contentSize - layoutSize);
};

/** Перелёт за верхнюю границу, ≥ 0 */
export const resolveOverscrollTop = (offset: number): number => {
  "worklet";

  return Math.max(0, -offset);
};

/** Перелёт за нижнюю границу, ≥ 0 */
export const resolveOverscrollBottom = (
  offset: number,
  maxOffset: number,
): number => {
  "worklet";

  return Math.max(0, offset - maxOffset);
};
