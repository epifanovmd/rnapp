import type { ChartDatum, IChartSeries } from "../core/types";

export interface ComputeDomainOptions {
  beginAtZero?: boolean;
  paddingRatio?: number;
}

const accessors: Record<"x" | "y", (datum: ChartDatum) => number> = {
  x: datum => datum.x,
  y: datum => datum.y,
};

export const computeDomain = (
  series: IChartSeries[],
  axis: "x" | "y",
  options: ComputeDomainOptions = {},
): [number, number] => {
  const accessor = accessors[axis];
  let min = Infinity;
  let max = -Infinity;

  series.forEach(item => {
    item.data.forEach(datum => {
      const value = accessor(datum);

      if (value < min) min = value;
      if (value > max) max = value;
    });
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [0, 1];
  }

  if (options.beginAtZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  if (min === max) {
    min -= 1;
    max += 1;
  }

  const paddingRatio = options.paddingRatio ?? 0;

  if (paddingRatio > 0) {
    const span = max - min;

    min -= span * paddingRatio;
    max += span * paddingRatio;
  }

  return [min, max];
};
