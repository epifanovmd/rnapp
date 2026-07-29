import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import type { IChartSeries, IScale, PixelPoint } from "../types";

export const useSeriesGeometry = (
  seriesShared: SharedValue<IChartSeries[]>,
  xScale: IScale,
  yScale: IScale,
): DerivedValue<Record<string, PixelPoint[]>> =>
  useDerivedValue(() => {
    const result: Record<string, PixelPoint[]> = {};

    for (const item of seriesShared.value) {
      result[item.id] = item.data.map(datum => ({
        x: xScale.toRange(datum.x),
        y: yScale.toRange(datum.y),
      }));
    }

    return result;
  }, [seriesShared, xScale, yScale]);
