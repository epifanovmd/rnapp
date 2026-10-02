/** Участок пути якоря, на котором идёт переход. */
export interface IRevealRangeOptions {
  /** Доля высоты якоря, ушедшая за верхний край, — начало перехода. По умолчанию 0.3. */
  start?: number;
  /** Доля высоты якоря — конец перехода. По умолчанию 1 (якорь скрыт целиком). */
  end?: number;
  /** Путь перехода в px от `start` — вместо `end` (для якорей переменной высоты). */
  distance?: number;
}

const DEFAULT_START = 0.3;
const DEFAULT_END = 1;

const clamp01 = (value: number): number => {
  "worklet";

  return Math.min(Math.max(value, 0), 1);
};

/** Начало и конец перехода в px от верха якоря. */
export const resolveRevealRange = (
  anchorHeight: number,
  options: IRevealRangeOptions,
): [number, number] => {
  "worklet";

  const start = anchorHeight * (options.start ?? DEFAULT_START);
  const end =
    options.distance !== undefined
      ? start + options.distance
      : anchorHeight * (options.end ?? DEFAULT_END);

  return [start, Math.max(end, start + 1)];
};

/**
 * Прогресс ухода якоря за верхний край видимой области: 0 — виден, 1 —
 * переход завершён. `visibleTop` — верх видимой области в координатах
 * контента (offsetY + перекрытие сверху), `anchorTop` — верх якоря в них же.
 * Пока якорь не измерен (высота 0) — 0.
 */
export const revealProgress = (
  visibleTop: number,
  anchorTop: number,
  anchorHeight: number,
  options: IRevealRangeOptions,
): number => {
  "worklet";

  if (!(anchorHeight > 0)) {
    return 0;
  }

  const [from, to] = resolveRevealRange(anchorHeight, options);

  return clamp01((visibleTop - anchorTop - from) / (to - from));
};

/** Прогресс внутри участка `[from, to]` общего прогресса (для поэтапных анимаций). */
export const subProgress = (
  progress: number,
  from: number,
  to: number,
): number => {
  "worklet";

  if (to <= from) {
    return progress >= to ? 1 : 0;
  }

  return clamp01((progress - from) / (to - from));
};
