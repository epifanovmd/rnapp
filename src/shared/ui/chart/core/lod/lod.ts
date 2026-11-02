/** Точка уровня детализации: координаты в домене. */
export interface LodPoint {
  x: number;
  y: number;
}

/** Уровни детализации серии: `[0]` — исходные данные, далее каждый вдвое реже. */
export type LodLevels = LodPoint[][];

/** Видимый срез уровня: индексы включительно, с одной точкой за каждым краем. */
export interface VisibleSlice {
  level: number;
  from: number;
  to: number;
}

/** Меньше этого уровень не прореживается дальше. */
const MIN_LEVEL_LENGTH = 64;

/** Корзина прореживания: из 4 точек остаются минимум и максимум в порядке по X. */
const BUCKET = 4;

/** Следующий уровень: min-max каждой корзины — пики не теряются. */
const decimate = (points: LodPoint[]): LodPoint[] => {
  "worklet";

  const result: LodPoint[] = [];

  for (let start = 0; start < points.length; start += BUCKET) {
    const end = Math.min(start + BUCKET, points.length);
    let minIndex = start;
    let maxIndex = start;

    for (let index = start + 1; index < end; index++) {
      if (points[index].y < points[minIndex].y) minIndex = index;
      if (points[index].y > points[maxIndex].y) maxIndex = index;
    }

    if (minIndex === maxIndex) {
      result.push(points[minIndex]);
    } else if (minIndex < maxIndex) {
      result.push(points[minIndex], points[maxIndex]);
    } else {
      result.push(points[maxIndex], points[minIndex]);
    }
  }

  return result;
};

/**
 * Пирамида min-max прореживания: каждый уровень примерно вдвое короче
 * предыдущего, пока не станет короче `MIN_LEVEL_LENGTH * 2`. Сумма длин
 * уровней ≈ длина данных; строится один раз на смену данных.
 */
export const buildLodLevels = (data: LodPoint[]): LodLevels => {
  "worklet";

  const levels: LodLevels = [data];

  while (levels[levels.length - 1].length > MIN_LEVEL_LENGTH * 2) {
    const previous = levels[levels.length - 1];
    const next = decimate(previous);

    if (next.length >= previous.length) break;
    levels.push(next);
  }

  return levels;
};

/** Первый индекс точки с `x >= value` (длина массива, если таких нет). */
export const lowerBoundX = (points: LodPoint[], value: number): number => {
  "worklet";

  let low = 0;
  let high = points.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (points[mid].x < value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
};

/** Последний индекс точки с `x <= value` (-1, если таких нет). */
export const upperBoundX = (points: LodPoint[], value: number): number => {
  "worklet";

  let low = 0;
  let high = points.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (points[mid].x <= value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low - 1;
};

/** Индекс ближайшей по X точки (-1 для пустого массива). */
export const nearestIndexX = (points: LodPoint[], value: number): number => {
  "worklet";

  if (points.length === 0) {
    return -1;
  }

  const index = lowerBoundX(points, value);

  if (index >= points.length) return points.length - 1;
  if (
    index > 0 &&
    Math.abs(points[index - 1].x - value) <= Math.abs(points[index].x - value)
  ) {
    return index - 1;
  }

  return index;
};

/**
 * Срез уровня для окна `[start, end]`: уровень — самый подробный, где точек
 * в окне не больше `maxPoints`; по одной точке за краями — линия уходит за
 * край, а не обрывается. `null` — данных нет.
 */
export const visibleSlice = (
  levels: LodLevels,
  start: number,
  end: number,
  maxPoints: number,
): VisibleSlice | null => {
  "worklet";

  const base = levels[0];

  if (!base || base.length === 0) {
    return null;
  }

  const baseCount = upperBoundX(base, end) - lowerBoundX(base, start) + 1;
  let level = 0;

  if (maxPoints > 0 && baseCount > maxPoints) {
    level = Math.min(
      Math.ceil(Math.log2(baseCount / maxPoints)),
      levels.length - 1,
    );
  }

  const points = levels[level];
  const from = Math.max(lowerBoundX(points, start) - 1, 0);
  const to = Math.min(upperBoundX(points, end) + 1, points.length - 1);

  return { level, from, to };
};

/**
 * Min/max по Y точек среза, попавших в окно `[start, end]`; если в окне нет
 * ни одной точки (окно между соседними) — по точкам среза за краями.
 */
export const sliceExtent = (
  points: LodPoint[],
  slice: VisibleSlice,
  start: number,
  end: number,
): [number, number] | null => {
  "worklet";

  let min = Infinity;
  let max = -Infinity;
  let outerMin = Infinity;
  let outerMax = -Infinity;

  for (let index = slice.from; index <= slice.to; index++) {
    const point = points[index];

    if (point.x >= start && point.x <= end) {
      if (point.y < min) min = point.y;
      if (point.y > max) max = point.y;
    } else {
      if (point.y < outerMin) outerMin = point.y;
      if (point.y > outerMax) outerMax = point.y;
    }
  }

  if (min <= max) {
    return [min, max];
  }

  return outerMin <= outerMax ? [outerMin, outerMax] : null;
};
