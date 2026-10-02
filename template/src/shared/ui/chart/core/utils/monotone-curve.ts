/** Кубический сегмент до точки `(x, y)` с опорными `c1`, `c2`. */
export interface ICurveSegment {
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  x: number;
  y: number;
}

interface ICurvePoint {
  x: number;
  y: number;
}

const sign = (value: number): number => {
  "worklet";

  return value < 0 ? -1 : 1;
};

/** Наклон во внутренней точке (Fritsch–Carlson): у экстремума — 0, без перелёта. */
const interiorSlope = (
  prev: ICurvePoint,
  point: ICurvePoint,
  next: ICurvePoint,
): number => {
  "worklet";

  const h0 = point.x - prev.x;
  const h1 = next.x - point.x;
  const s0 = h0 ? (point.y - prev.y) / h0 : 0;
  const s1 = h1 ? (next.y - point.y) / h1 : 0;
  const p = h0 + h1 ? (s0 * h1 + s1 * h0) / (h0 + h1) : 0;
  const slope =
    (sign(s0) + sign(s1)) *
    Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p));

  return Number.isFinite(slope) ? slope : 0;
};

/** Наклон на краю — по соседнему наклону, как у `d3.curveMonotoneX`. */
const edgeSlope = (
  from: ICurvePoint,
  to: ICurvePoint,
  neighbor: number,
): number => {
  "worklet";

  const h = to.x - from.x;

  return h ? (3 * (to.y - from.y)) / h / 2 - neighbor / 2 : neighbor;
};

/**
 * Монотонная кубическая кривая по X (как `d3.curveMonotoneX`): опорные
 * точки сегмента — на трети его ширины, наклоны ограничены, поэтому кривая
 * не разворачивается по X (нет петель при неравномерном шаге) и не
 * перелетает значения соседних точек (нет провала ниже нуля). Меньше трёх
 * точек — пусто (рисуется отрезком).
 */
export const monotoneSegments = (points: ICurvePoint[]): ICurveSegment[] => {
  "worklet";

  const count = points.length;

  if (count < 3) return [];

  const slopes: number[] = new Array(count);

  for (let index = 1; index < count - 1; index++) {
    slopes[index] = interiorSlope(
      points[index - 1],
      points[index],
      points[index + 1],
    );
  }
  slopes[0] = edgeSlope(points[0], points[1], slopes[1]);
  slopes[count - 1] = edgeSlope(
    points[count - 2],
    points[count - 1],
    slopes[count - 2],
  );

  const segments: ICurveSegment[] = [];

  for (let index = 0; index < count - 1; index++) {
    const from = points[index];
    const to = points[index + 1];
    const third = (to.x - from.x) / 3;

    segments.push({
      c1x: from.x + third,
      c1y: from.y + third * slopes[index],
      c2x: to.x - third,
      c2y: to.y - third * slopes[index + 1],
      x: to.x,
      y: to.y,
    });
  }

  return segments;
};
