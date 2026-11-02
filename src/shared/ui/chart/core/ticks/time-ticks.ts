/** Единица шага временных делений — по ней форматтер выбирает вид подписи. */
export type TimeTickUnit =
  "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

export interface TimeTicks {
  unit: TimeTickUnit;
  /** Сколько единиц в одном шаге (например, 6 часов). */
  count: number;
  values: number[];
}

interface TimeStep {
  unit: TimeTickUnit;
  count: number;
  /** Приблизительная длительность шага, мс — для выбора шага. */
  ms: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const TIME_STEPS: TimeStep[] = [
  { unit: "second", count: 1, ms: SECOND },
  { unit: "second", count: 5, ms: 5 * SECOND },
  { unit: "second", count: 15, ms: 15 * SECOND },
  { unit: "second", count: 30, ms: 30 * SECOND },
  { unit: "minute", count: 1, ms: MINUTE },
  { unit: "minute", count: 5, ms: 5 * MINUTE },
  { unit: "minute", count: 15, ms: 15 * MINUTE },
  { unit: "minute", count: 30, ms: 30 * MINUTE },
  { unit: "hour", count: 1, ms: HOUR },
  { unit: "hour", count: 3, ms: 3 * HOUR },
  { unit: "hour", count: 6, ms: 6 * HOUR },
  { unit: "hour", count: 12, ms: 12 * HOUR },
  { unit: "day", count: 1, ms: DAY },
  { unit: "day", count: 2, ms: 2 * DAY },
  { unit: "week", count: 1, ms: 7 * DAY },
  { unit: "month", count: 1, ms: 30 * DAY },
  { unit: "month", count: 3, ms: 91 * DAY },
  { unit: "month", count: 6, ms: 182 * DAY },
  { unit: "year", count: 1, ms: 365 * DAY },
  { unit: "year", count: 2, ms: 2 * 365 * DAY },
  { unit: "year", count: 5, ms: 5 * 365 * DAY },
  { unit: "year", count: 10, ms: 10 * 365 * DAY },
];

/** Самый мелкий шаг, при котором делений не больше `count`. */
export const pickTimeStep = (span: number, count: number): TimeStep => {
  "worklet";

  for (const step of TIME_STEPS) {
    if (span / step.ms <= count) {
      return step;
    }
  }

  return TIME_STEPS[TIME_STEPS.length - 1];
};

/** Начало шага, в который попадает `value` (местное время). */
const floorToStep = (value: number, step: TimeStep): Date => {
  "worklet";

  const date = new Date(value);

  switch (step.unit) {
    case "second":
      date.setMilliseconds(0);
      date.setSeconds(date.getSeconds() - (date.getSeconds() % step.count));
      break;
    case "minute":
      date.setSeconds(0, 0);
      date.setMinutes(date.getMinutes() - (date.getMinutes() % step.count));
      break;
    case "hour":
      date.setMinutes(0, 0, 0);
      date.setHours(date.getHours() - (date.getHours() % step.count));
      break;
    case "day":
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - ((date.getDate() - 1) % step.count));
      break;
    case "week":
      date.setHours(0, 0, 0, 0);
      // Неделя — с понедельника.
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      break;
    case "month":
      date.setHours(0, 0, 0, 0);
      date.setDate(1);
      date.setMonth(date.getMonth() - (date.getMonth() % step.count));
      break;
    case "year":
      date.setHours(0, 0, 0, 0);
      date.setMonth(0, 1);
      date.setFullYear(date.getFullYear() - (date.getFullYear() % step.count));
      break;
  }

  return date;
};

/** Следующий шаг по календарю — переход на летнее время и длина месяца учтены. */
const advance = (date: Date, step: TimeStep): void => {
  "worklet";

  switch (step.unit) {
    case "second":
      date.setSeconds(date.getSeconds() + step.count);
      break;
    case "minute":
      date.setMinutes(date.getMinutes() + step.count);
      break;
    case "hour":
      date.setHours(date.getHours() + step.count);
      break;
    case "day":
      date.setDate(date.getDate() + step.count);
      break;
    case "week":
      date.setDate(date.getDate() + 7 * step.count);
      break;
    case "month":
      date.setMonth(date.getMonth() + step.count);
      break;
    case "year":
      date.setFullYear(date.getFullYear() + step.count);
      break;
  }
};

/** Предел числа делений: защита от бесконечного цикла на вырожденных входах. */
const MAX_TICKS = 500;

/**
 * Деления по календарю внутри `[min, max]` (мс): начала часов, суток, недель,
 * месяцев, лет — шаг подбирается так, чтобы на `stepSpan` (по умолчанию
 * размах `[min, max]`) делений было не больше `count`.
 */
export const timeTicks = (
  min: number,
  max: number,
  count: number,
  stepSpan?: number,
): TimeTicks => {
  "worklet";

  const step = pickTimeStep(
    Math.max(stepSpan ?? max - min, 0),
    Math.max(count, 1),
  );
  const values: number[] = [];

  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { unit: step.unit, count: step.count, values };
  }

  const cursor = floorToStep(min, step);

  while (cursor.getTime() <= max && values.length < MAX_TICKS) {
    const time = cursor.getTime();

    if (time >= min) {
      values.push(time);
    }
    advance(cursor, step);
  }

  return { unit: step.unit, count: step.count, values };
};
