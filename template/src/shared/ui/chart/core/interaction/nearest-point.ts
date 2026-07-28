import type { ChartDatum, IScale } from "../types";

export const findNearestIndex = (
  xScale: IScale,
  data: ChartDatum[],
  touchXPixel: number,
): number => {
  "worklet";

  if (data.length === 0) {
    return -1;
  }

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  for (let index = 0; index < data.length; index++) {
    const pixelX = xScale.toRange(data[index].x);
    const distance = Math.abs(pixelX - touchXPixel);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
};

export const findActiveIndex = (
  xScale: IScale,
  data: ChartDatum[],
  touchXPixel: number,
  isActive: boolean,
): number => {
  "worklet";

  if (!isActive || data.length === 0) {
    return -1;
  }

  return findNearestIndex(xScale, data, touchXPixel);
};
