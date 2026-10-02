import type { ChartPadding, IChartSeries, LinearScale } from "../../core";
import { nearestIndexX, scaleToRange } from "../../core";
import type { MarkerAnchor } from "./types";

/** Разрешает MarkerAnchor в пиксельные координаты или null. */
export const resolveMarkerPosition = (
  anchor: MarkerAnchor,
  series: IChartSeries[],
  xScale: LinearScale,
  yScale: LinearScale,
  padding: ChartPadding,
): { x: number; y: number } | null => {
  "worklet";

  if (anchor.kind === "pixel") {
    return { x: padding.left + anchor.x, y: padding.top + anchor.y };
  }

  if (anchor.kind === "domain") {
    return {
      x: scaleToRange(xScale, anchor.x),
      y: scaleToRange(yScale, anchor.y),
    };
  }

  const target = series.find(item => item.id === anchor.seriesId);

  if (!target || target.data.length === 0) {
    return null;
  }

  const index = nearestIndexX(target.data, anchor.x);
  const datum = target.data[index];

  return { x: scaleToRange(xScale, datum.x), y: scaleToRange(yScale, datum.y) };
};
