import type { ChartDatum, IChartSeries, IScale } from "../../core/types";
import type { MarkerAnchor } from "./types";

const findNearestIndexByDomainX = (data: ChartDatum[], x: number): number => {
  let nearestIndex = -1;
  let nearestDistance = Infinity;

  for (let index = 0; index < data.length; index++) {
    const distance = Math.abs(data[index].x - x);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
};

export const resolveMarkerPosition = (
  anchor: MarkerAnchor,
  series: IChartSeries[],
  xScale: IScale,
  yScale: IScale,
): { x: number; y: number } | null => {
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
