/** Видимое окно по X (доменные координаты). */
export interface ViewRange {
  start: number;
  end: number;
}

/** Границы окна: экстент данных и минимальная ширина окна. */
export interface ViewLimits {
  min: number;
  max: number;
  minSpan: number;
}

/** Доля ширины окна, в пределах которой края считаются совпавшими. */
const EDGE_EPSILON_RATIO = 1e-6;

const edgeEpsilon = (span: number): number => {
  "worklet";

  return Math.max(Math.abs(span) * EDGE_EPSILON_RATIO, 1e-9);
};

/** Окно задано (до первых данных — NaN). */
export const isRangeValid = (range: ViewRange): boolean => {
  "worklet";

  return (
    Number.isFinite(range.start) &&
    Number.isFinite(range.end) &&
    range.end > range.start
  );
};

/** Ширина окна в пределах `[minSpan, вся ширина данных]`. */
export const clampSpan = (span: number, limits: ViewLimits): number => {
  "worklet";

  const full = limits.max - limits.min;
  const minSpan = Math.min(limits.minSpan, full);

  return Math.min(Math.max(span, minSpan), full);
};

/** Окно внутри данных: ширина ограничена, края не выходят за экстент. */
export const clampRange = (range: ViewRange, limits: ViewLimits): ViewRange => {
  "worklet";

  if (!(limits.max > limits.min)) {
    return { start: limits.min, end: limits.max };
  }

  const span = clampSpan(range.end - range.start, limits);
  const start = Math.min(Math.max(range.start, limits.min), limits.max - span);

  return { start, end: start + span };
};

/**
 * Окно ширины `span`, в котором `anchor` стоит на доле `ratio` от левого края
 * (0 — левый край, 1 — правый): точка под пальцами остаётся под ними.
 */
export const anchoredRange = (
  anchor: number,
  ratio: number,
  span: number,
): ViewRange => {
  "worklet";

  const start = anchor - ratio * span;

  return { start, end: start + span };
};

/** Зум вокруг `anchor`: `factor > 1` приближает, `< 1` отдаляет. */
export const zoomRange = (
  range: ViewRange,
  anchor: number,
  factor: number,
): ViewRange => {
  "worklet";

  const span = range.end - range.start;
  const ratio = span === 0 ? 0.5 : (anchor - range.start) / span;

  return anchoredRange(anchor, ratio, span / factor);
};

/** Сдвиг окна на `delta` (домен). */
export const panRange = (range: ViewRange, delta: number): ViewRange => {
  "worklet";

  return { start: range.start + delta, end: range.end + delta };
};

/** Сопротивление за краем (как у iOS-скролла): чем дальше, тем меньше отдача. */
export const rubberDistance = (distance: number, dimension: number): number => {
  "worklet";

  if (dimension <= 0) {
    return 0;
  }

  return (1 - 1 / ((distance * 0.55) / dimension + 1)) * dimension;
};

/** Окно при перетаскивании: заход за край данных — с сопротивлением. */
export const rubberRange = (
  range: ViewRange,
  limits: ViewLimits,
): ViewRange => {
  "worklet";

  const span = clampSpan(range.end - range.start, limits);
  let start = range.start;

  if (start < limits.min) {
    start = limits.min - rubberDistance(limits.min - start, span);
  } else if (start + span > limits.max) {
    start = limits.max - span + rubberDistance(start + span - limits.max, span);
  }

  return { start, end: start + span };
};

/** Окно показывает все данные. */
export const isFullRange = (range: ViewRange, limits: ViewLimits): boolean => {
  "worklet";

  const epsilon = edgeEpsilon(limits.max - limits.min);

  return (
    range.start <= limits.min + epsilon && range.end >= limits.max - epsilon
  );
};

/** Правый край окна на последней точке — окно «следит» за новыми данными. */
export const isAtEnd = (range: ViewRange, limits: ViewLimits): boolean => {
  "worklet";

  return range.end >= limits.max - edgeEpsilon(range.end - range.start);
};

/** Окно ширины `span` у правого края данных (`span <= 0` — все данные). */
export const lastRange = (span: number, limits: ViewLimits): ViewRange => {
  "worklet";

  if (!(span > 0)) {
    return { start: limits.min, end: limits.max };
  }

  return clampRange({ start: limits.max - span, end: limits.max }, limits);
};

/** К чему прижато окно: к концу данных (следит за ними), ко всем данным или ни к чему. */
export type ViewPin = "none" | "end" | "all";

/** Привязка окна к данным. */
export const resolveViewPin = (
  range: ViewRange,
  limits: ViewLimits,
): ViewPin => {
  "worklet";

  if (!isRangeValid(range) || !(limits.max > limits.min)) return "none";
  if (isFullRange(range, limits)) return "all";

  return isAtEnd(range, limits) ? "end" : "none";
};

/** Окно, догоняющее данные после жеста, по привязке до него; `null` — догонять не нужно. */
export const pinnedRange = (
  pin: ViewPin,
  range: ViewRange,
  limits: ViewLimits,
): ViewRange | null => {
  "worklet";

  if (pin === "none") return null;

  return lastRange(pin === "all" ? 0 : range.end - range.start, limits);
};

export interface ReconcileInput {
  /** Текущее окно (NaN — ещё не задано). */
  range: ViewRange;
  /** Экстент данных до изменения (NaN — данных не было). */
  previous: ViewLimits;
  next: ViewLimits;
  /** Ширина окна до первых данных: `<= 0` — все данные. */
  initialSpan: number;
}

/**
 * Окно после смены данных:
 * - первые данные — `initialSpan` у правого края;
 * - окно было на всех данных — остаётся на всех;
 * - правый край был на последней точке — окно едет за новыми данными;
 * - иначе окно стоит на месте, только поджимается к новому экстенту.
 */
export const reconcileRange = ({
  range,
  previous,
  next,
  initialSpan,
}: ReconcileInput): ViewRange => {
  "worklet";

  if (!(next.max > next.min)) {
    return { start: next.min, end: next.max };
  }

  const hadData = previous.max > previous.min;

  if (!isRangeValid(range) || !hadData) {
    return lastRange(initialSpan, next);
  }

  if (isFullRange(range, previous)) {
    return { start: next.min, end: next.max };
  }

  if (isAtEnd(range, previous)) {
    return clampRange(panRange(range, next.max - previous.max), next);
  }

  return clampRange(range, next);
};

export interface SpanPreset<K extends string = string> {
  key: K;
  /** Ширина окна (домен); `"all"` — все данные. */
  span: number | "all";
}

/**
 * Пресет, ширине которого соответствует окно (с допуском `tolerance` в
 * долях); `null` — окно задано вручную. Пресеты не уже всех данных
 * совпадают с `"all"`, если он есть.
 */
export const matchSpanPreset = <K extends string>(
  span: number,
  fullSpan: number,
  presets: readonly SpanPreset<K>[],
  tolerance: number,
): K | null => {
  "worklet";

  if (!(fullSpan > 0)) {
    return null;
  }

  const allPreset = presets.find(preset => preset.span === "all");
  const coversAll = span >= fullSpan * (1 - tolerance);

  if (allPreset && coversAll) {
    return allPreset.key;
  }

  for (const preset of presets) {
    if (preset.span === "all") continue;

    const target = Math.min(preset.span, fullSpan);

    if (target > 0 && Math.abs(span - target) <= target * tolerance) {
      return preset.key;
    }
  }

  return null;
};

/**
 * Минимальная ширина окна по данным: пять средних интервалов между точками
 * самой частой серии; 0 — данных меньше двух точек.
 */
export const autoMinSpan = (series: { data: { x: number }[] }[]): number => {
  let interval = Infinity;

  for (const item of series) {
    const { data } = item;

    if (data.length < 2) continue;

    const average = (data[data.length - 1].x - data[0].x) / (data.length - 1);

    if (average > 0 && average < interval) interval = average;
  }

  return Number.isFinite(interval) ? interval * 5 : 0;
};
