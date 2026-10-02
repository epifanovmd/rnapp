/** Шаг делений, кратный 1, 2, 2.5 или 5 × 10ⁿ, — не меньше `span / count`. */
export const niceStep = (span: number, count: number): number => {
  "worklet";

  if (!(span > 0) || !(count > 0)) {
    return 0;
  }

  const raw = span / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;

  let nice = 10;

  if (normalized <= 1) {
    nice = 1;
  } else if (normalized <= 2) {
    nice = 2;
  } else if (normalized <= 2.5) {
    nice = 2.5;
  } else if (normalized <= 5) {
    nice = 5;
  }

  return nice * magnitude;
};

/**
 * Единица `base^k`, в которой `value` лежит в `[1, base)`: для байтов
 * (`base` 1024) — 1, 1024 (КБ), 1024² (МБ)…; меньше единицы — 1.
 */
export const unitMagnitude = (value: number, base: number): number => {
  "worklet";

  const abs = Math.abs(value);
  let magnitude = 1;

  if (!(base > 1) || !Number.isFinite(abs)) {
    return magnitude;
  }

  while (abs / magnitude >= base && magnitude < 1e30) {
    magnitude *= base;
  }

  return magnitude;
};

/** Знаков после запятой, чтобы шаг в единицах `magnitude` читался без потерь. */
export const tickDecimals = (step: number, magnitude: number): number => {
  "worklet";

  const value = step / (magnitude || 1);

  if (!(value > 0) || !Number.isFinite(value)) {
    return 0;
  }

  let decimals = 0;

  while (
    decimals < 6 &&
    Math.abs(value * Math.pow(10, decimals) - Math.round(value * Math.pow(10, decimals))) > 1e-6
  ) {
    decimals++;
  }

  return decimals;
};

/** Значение, кратное шагу, без хвостов плавающей точки. */
const multipleOf = (step: number, index: number): number => {
  "worklet";

  return Number((step * index).toPrecision(12));
};

/**
 * Деления, кратные «круглому» шагу, внутри `[min, max]`. Шаг — по
 * `stepSpan` (по умолчанию размах `[min, max]`): так деления за краями окна
 * строятся с тем же шагом, что и видимые. `magnitude` — единица, в которой
 * шаг «круглый» (например, 1024² — шаг в целых МБ).
 */
export const niceTicks = (
  min: number,
  max: number,
  count: number,
  stepSpan?: number,
  magnitude?: number,
): number[] => {
  "worklet";

  const unit = magnitude ?? 1;
  const step = niceStep((stepSpan ?? max - min) / unit, count) * unit;

  if (step === 0) {
    return Number.isFinite(min) ? [min] : [];
  }

  const first = Math.ceil(min / step - 1e-9);
  const last = Math.floor(max / step + 1e-9);
  const result: number[] = [];

  for (let index = first; index <= last; index++) {
    result.push(multipleOf(step, index));
  }

  return result;
};

/** Равные доли `[min, max]`: `count + 1` делений, включая края. */
export const divideTicks = (
  min: number,
  max: number,
  count: number,
): number[] => {
  "worklet";

  if (count <= 0) {
    return [];
  }

  const step = (max - min) / count;
  const result: number[] = [];

  for (let index = 0; index <= count; index++) {
    result.push(min + step * index);
  }

  return result;
};

/** Расширяет `[min, max]` до ближайших кратных «круглого» (в единицах `magnitude`) шага. */
export const niceDomain = (
  min: number,
  max: number,
  count: number,
  magnitude?: number,
): [number, number] => {
  "worklet";

  const unit = magnitude ?? 1;
  const step = niceStep((max - min) / unit, count) * unit;

  if (step === 0) {
    return [min, max];
  }

  return [
    multipleOf(step, Math.floor(min / step + 1e-9)),
    multipleOf(step, Math.ceil(max / step - 1e-9)),
  ];
};
