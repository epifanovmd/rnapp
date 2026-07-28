import type { ChartDatum } from "./types";

export type TrendCompareMode = "first" | "previous";
export type TrendDirection = "up" | "down" | "flat";

export interface SeriesTrend {
  change: number;
  percent: number;
  direction: TrendDirection;
}

export const computeTrend = (
  data: ChartDatum[],
  compare: TrendCompareMode = "previous",
): SeriesTrend | null => {
  if (data.length < 2) {
    return null;
  }

  const last = data[data.length - 1].y;
  const base = compare === "previous" ? data[data.length - 2].y : data[0].y;
  const change = last - base;
  const percent = base !== 0 ? (change / Math.abs(base)) * 100 : 0;
  const direction: TrendDirection =
    change > 0 ? "up" : change < 0 ? "down" : "flat";

  return { change, percent, direction };
};

export const resolveTrendColor = (
  direction: TrendDirection,
  upColor: string,
  downColor: string,
  neutralColor: string,
): string => {
  if (direction === "up") {
    return upColor;
  }

  if (direction === "down") {
    return downColor;
  }

  return neutralColor;
};
