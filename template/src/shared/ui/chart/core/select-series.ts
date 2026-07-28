import type { IChartSeries } from "./types";

export interface SeriesSelector {
  seriesId?: string;
  seriesIds?: string[];
}

export const selectSeries = (
  series: IChartSeries[],
  selector: SeriesSelector,
): IChartSeries[] => {
  if (selector.seriesId) {
    return series.filter(item => item.id === selector.seriesId);
  }

  if (selector.seriesIds) {
    const ids = new Set(selector.seriesIds);

    return series.filter(item => ids.has(item.id));
  }

  return series;
};
