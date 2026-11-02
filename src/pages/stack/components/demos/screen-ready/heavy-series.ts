import type { IChartSeries } from "@shared/ui/chart";

const POINTS = 240;

/** Синтетическая серия для тяжёлого экрана: синусоида с шумом. */
export const createHeavySeries = (
  id: string,
  color: string,
  phase: number,
): IChartSeries[] => [
  {
    id,
    label: id,
    color,
    data: Array.from({ length: POINTS }, (_, index) => ({
      x: index,
      y:
        50 +
        30 * Math.sin(index / 12 + phase) +
        10 * Math.sin(index / 3 + phase * 2),
    })),
  },
];
