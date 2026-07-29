import type { IChartSeries } from "../types";

/** Фильтрует series по id; без id возвращает все серии (worklet). */
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
