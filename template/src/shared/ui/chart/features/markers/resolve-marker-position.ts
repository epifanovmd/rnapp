import type { ChartDatum, IChartSeries, IScale } from "../../core";
import type { MarkerAnchor } from "./types";

/** Бинарный поиск ближайшего по domain-X индекса в данных. */
const findNearestIndexByDomainX = (data: ChartDatum[], x: number): number => {
  "worklet";

  let low = 0;
  let high = data.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (data[mid].x < x) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  if (low > 0 && Math.abs(data[low - 1].x - x) <= Math.abs(data[low].x - x)) {
    return low - 1;
  }

  return low;
};

/** Разрешает MarkerAnchor в пиксельные координаты или null. */
export const resolveMarkerPosition = (
  anchor: MarkerAnchor,
  series: IChartSeries[],
  xScale: IScale,
  yScale: IScale,
): { x: number; y: number } | null => {
  "worklet";

  if (anchor.kind === "pixel") {
    return { x: anchor.x, y: anchor.y };
  }

  if (anchor.kind === "domain") {
    return { x: xScale.toRange(anchor.x), y: yScale.toRange(anchor.y) };
  }

  const target = series.find(item => item.id === anchor.seriesId);

  if (!target || target.data.length === 0) {
    return null;
  }

  const index = findNearestIndexByDomainX(target.data, anchor.x);
  const datum = target.data[index];

  return { x: xScale.toRange(datum.x), y: yScale.toRange(datum.y) };
};
