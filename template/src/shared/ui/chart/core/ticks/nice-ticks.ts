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

/** Значение, кратное шагу, без хвостов плавающей точки. */
const multipleOf = (step: number, index: number): number => {
  "worklet";

  return Number((step * index).toPrecision(12));
};

/**
 * Деления, кратные «круглому» шагу, внутри `[min, max]`. Шаг — по
 * `stepSpan` (по умолчанию размах `[min, max]`): так деления за краями окна
 * строятся с тем же шагом, что и видимые.
 */
export const niceTicks = (
  min: number,
  max: number,
  count: number,
  stepSpan?: number,
): number[] => {
  "worklet";

  const step = niceStep(stepSpan ?? max - min, count);

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

/** Расширяет `[min, max]` до ближайших кратных «круглого» шага. */
export const niceDomain = (
  min: number,
  max: number,
  count: number,
): [number, number] => {
  "worklet";

  const step = niceStep(max - min, count);

  if (step === 0) {
    return [min, max];
  }

  return [
    multipleOf(step, Math.floor(min / step + 1e-9)),
    multipleOf(step, Math.ceil(max / step - 1e-9)),
  ];
};
