import type { IChartSeries } from "../types";

export const selectSeries = (
  series: IChartSeries[],
  seriesId?: string,
): IChartSeries[] => {
  "worklet";

  if (seriesId) {
    return series.filter(item => item.id === seriesId);
  }

  return series;
};
