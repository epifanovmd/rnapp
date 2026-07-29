import { createContext, useContext } from "react";
import type { DerivedValue, SharedValue } from "react-native-reanimated";

import type { IChartSeries, PixelPoint } from "../types";

/** Серии данных и пиксельная геометрия ({ seriesId -> PixelPoint[] }). */
export interface ChartSeriesContextValue {
  series: IChartSeries[];
  seriesShared: SharedValue<IChartSeries[]>;
  geometry: DerivedValue<Record<string, PixelPoint[]>>;
}

export const ChartSeriesContext = createContext<ChartSeriesContextValue | null>(
  null,
);

export const useChartSeries = (): ChartSeriesContextValue => {
  const context = useContext(ChartSeriesContext);

  if (!context) {
    throw new Error("useChartSeries must be used inside <Chart>.");
  }

  return context;
};
