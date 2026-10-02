/**
 * Линейная шкала как данные: домен `[d0, d1]` → пиксели `[r0, r1]`.
 * Без замыканий — свободно передаётся в worklet-ы и живёт в shared value.
 */
export interface LinearScale {
  d0: number;
  d1: number;
  r0: number;
  r1: number;
}

export const createLinearScale = (
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale => {
  "worklet";

  return { d0: domain[0], d1: domain[1], r0: range[0], r1: range[1] };
};

/** Значение домена → пиксель. */
export const scaleToRange = (scale: LinearScale, value: number): number => {
  "worklet";

  const span = scale.d1 - scale.d0 || 1;

  return scale.r0 + ((value - scale.d0) / span) * (scale.r1 - scale.r0);
};

/** Пиксель → значение домена. */
export const scaleToDomain = (scale: LinearScale, pixel: number): number => {
  "worklet";

  const span = scale.r1 - scale.r0 || 1;

  return scale.d0 + ((pixel - scale.r0) / span) * (scale.d1 - scale.d0);
};

/** Пиксель внутри диапазона шкалы (с допуском `tolerance`, px). */
export const isInScaleRange = (
  scale: LinearScale,
  pixel: number,
  tolerance: number,
): boolean => {
  "worklet";

  const low = Math.min(scale.r0, scale.r1) - tolerance;
  const high = Math.max(scale.r0, scale.r1) + tolerance;

  return pixel >= low && pixel <= high;
};
