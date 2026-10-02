import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import {
  buildLodLevels,
  LodLevels,
  sliceExtent,
  VisibleSlice,
  visibleSlice,
} from "../lod/lod";
import { LinearScale, scaleToRange } from "../scale/linear-scale";
import type { IChartSeries, PixelPoint } from "../types";
import type { ViewRange } from "../viewport/viewport-math";

export interface SeriesLod {
  id: string;
  levels: LodLevels;
}

export interface SeriesSlice {
  id: string;
  /** Точки выбранного уровня детализации. */
  points: LodLevels[number];
  slice: VisibleSlice | null;
}

export interface VisibleSlices {
  items: SeriesSlice[];
  /** Min/max Y видимых точек всех серий; `null` — точек нет. */
  extent: [number, number] | null;
}

/** Уровни детализации серий — пересчитываются только при смене данных (UI-поток). */
export const useSeriesLod = (
  seriesShared: SharedValue<IChartSeries[]>,
): DerivedValue<SeriesLod[]> =>
  useDerivedValue(
    () =>
      seriesShared.value.map(item => ({
        id: item.id,
        levels: buildLodLevels(item.data),
      })),
    [seriesShared],
  );

/**
 * Видимые срезы серий для окна: на серию — не больше `maxPoints` точек
 * (уровень детализации по плотности), плюс экстент Y для авто-домена.
 */
export const useVisibleSlices = (
  lod: DerivedValue<SeriesLod[]>,
  view: DerivedValue<ViewRange>,
  maxPoints: number,
): DerivedValue<VisibleSlices> =>
  useDerivedValue(() => {
    const { start, end } = view.value;
    const items: SeriesSlice[] = [];
    let min = Infinity;
    let max = -Infinity;

    for (const item of lod.value) {
      const slice = visibleSlice(item.levels, start, end, maxPoints);
      const points = item.levels[slice ? slice.level : 0] ?? [];

      items.push({ id: item.id, points, slice });

      if (slice) {
        const extent = sliceExtent(points, slice, start, end);

        if (extent) {
          if (extent[0] < min) min = extent[0];
          if (extent[1] > max) max = extent[1];
        }
      }
    }

    return { items, extent: min <= max ? [min, max] : null };
  }, [lod, view, maxPoints]);

/** Пиксельные точки видимых срезов: `{ seriesId -> PixelPoint[] }`. */
export const useSeriesGeometry = (
  slices: DerivedValue<VisibleSlices>,
  xScale: DerivedValue<LinearScale>,
  yScale: DerivedValue<LinearScale>,
): DerivedValue<Record<string, PixelPoint[]>> =>
  useDerivedValue(() => {
    const x = xScale.value;
    const y = yScale.value;
    const result: Record<string, PixelPoint[]> = {};

    for (const item of slices.value.items) {
      const pixels: PixelPoint[] = [];

      if (item.slice) {
        for (let index = item.slice.from; index <= item.slice.to; index++) {
          const point = item.points[index];

          pixels.push({
            x: scaleToRange(x, point.x),
            y: scaleToRange(y, point.y),
          });
        }
      }

      result[item.id] = pixels;
    }

    return result;
  }, [slices, xScale, yScale]);
