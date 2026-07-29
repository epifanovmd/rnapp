import type { ChartDatum } from "../types";

export type TrendCompareMode = "first" | "previous" | "sma-3" | "sma-5";
export type TrendDirection = "up" | "down" | "flat";
export type TrendColorMap = Record<TrendDirection, string>;

const compareTwoValues = (last: number, base: number): TrendDirection => {
  "worklet";

  return last > base ? "up" : last < base ? "down" : "flat";
};

const computeSmaTrend = (
  data: ChartDatum[],
  window: number,
): TrendDirection | null => {
  "worklet";

  if (data.length < window * 2) {
    return null;
  }

  let currentSum = 0;
  let previousSum = 0;

  for (let i = 0; i < window; i++) {
    currentSum += data[data.length - 1 - i].y;
    previousSum += data[data.length - 1 - window - i].y;
  }

  return compareTwoValues(currentSum / window, previousSum / window);
};

/**
 * Определяет направление тренда на основе данных серии и режима сравнения.
 *
 * - `"first"` — последняя точка против первой (общий тренд за весь период).
 * - `"previous"` — последняя точка против предыдущей (мгновенное изменение, дефолт).
 * - `"sma-3"` — скользящее среднее последних 3 точек против предыдущих 3.
 * - `"sma-5"` — скользящее среднее последних 5 точек против предыдущих 5.
 */
export const computeTrendDirection = (
  data: ChartDatum[],
  compare: TrendCompareMode,
): TrendDirection | null => {
  "worklet";

  if (data.length < 2) {
    return null;
  }

  switch (compare) {
    case "first":
      return compareTwoValues(data[data.length - 1].y, data[0].y);
    case "previous":
      return compareTwoValues(data[data.length - 1].y, data[data.length - 2].y);
    case "sma-3":
      return computeSmaTrend(data, 3);
    case "sma-5":
      return computeSmaTrend(data, 5);
  }
};
