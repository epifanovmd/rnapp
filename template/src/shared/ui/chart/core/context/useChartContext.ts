import { useMemo } from "react";

import { useChartGeometry } from "./chart-geometry-context";
import { useChartGesture } from "./chart-gesture-context";
import { useChartSeries } from "./chart-series-context";

/** Объединённый хук geometry + series + gesture в одном объекте. */
export const useChartContext = () => {
  const geometry = useChartGeometry();
  const series = useChartSeries();
  const gesture = useChartGesture();

  return useMemo(
    () => ({ ...geometry, ...series, ...gesture }),
    [geometry, series, gesture],
  );
};
