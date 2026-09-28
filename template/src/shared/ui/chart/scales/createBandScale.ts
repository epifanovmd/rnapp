/** Band-шкала: дискретные индексы -> непрерывные позиции на экране. */
export interface IBandScale {
  readonly range: [number, number];
  readonly bandwidth: number;
  start(index: number): number;
  center(index: number): number;
}

/** Опции для createBandScale. */
export interface BandScaleOptions {
  count: number;
  range: [number, number];
  paddingRatio?: number;
}

/** Создаёт band-шкалу для категориальных данных с равномерной шириной полос. */
export const createBandScale = ({
  count,
  range,
  paddingRatio = 0.3,
}: BandScaleOptions): IBandScale => {
  const [r0, r1] = range;
  const span = r1 - r0;
  const step = count > 0 ? span / count : span;
  const bandwidth = Math.max(step * (1 - paddingRatio), 0);
  const offset = (step - bandwidth) / 2;

  return {
    range,
    bandwidth,
    start: index => r0 + step * index + offset,
    center: index => r0 + step * index + step / 2,
  };
};
