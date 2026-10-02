import { niceDomain, unitMagnitude } from "../ticks/nice-ticks";

/**
 * Домен Y из экстента видимых точек — worklet: вызывается на UI-потоке на
 * каждое изменение окна. Используется вместо авто-домена.
 */
export type ChartYDomainResolver = (
  extent: [number, number],
) => [number, number];

export interface AutoYDomainOptions {
  /** Включать 0 в домен. */
  beginAtZero?: boolean;
  /** Запас по краям в долях размаха. */
  paddingRatio?: number;
  /** Округлять края до «круглого» шага при таком числе делений; 0 — без округления. */
  niceTickCount?: number;
  /** Шаг «круглый» в единицах `niceBase^k` (1024 — байты, как `ticks="binary"`). */
  niceBase?: number;
}

/**
 * Авто-домен Y: запас по краям, ноль (по опции), «круглые» края — домен
 * меняется ступенями, а не на каждый пиксель сдвига окна.
 */
export const resolveAutoYDomain = (
  extent: [number, number],
  options: AutoYDomainOptions,
): [number, number] => {
  "worklet";

  let [min, max] = extent;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [0, 1];
  }

  if (options.beginAtZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  if (min === max) {
    const delta = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1;

    min -= delta;
    max += delta;
  }

  const paddingRatio = options.paddingRatio ?? 0;

  if (paddingRatio > 0) {
    const span = max - min;

    // Ноль, включённый `beginAtZero`, остаётся краем — запас только с другой стороны.
    if (!(options.beginAtZero && min === 0)) min -= span * paddingRatio;
    if (!(options.beginAtZero && max === 0)) max += span * paddingRatio;
  }

  const tickCount = options.niceTickCount ?? 0;

  if (tickCount <= 0) {
    return [min, max];
  }

  const magnitude = options.niceBase
    ? unitMagnitude(Math.max(Math.abs(min), Math.abs(max)), options.niceBase)
    : 1;

  return niceDomain(min, max, tickCount, magnitude);
};
