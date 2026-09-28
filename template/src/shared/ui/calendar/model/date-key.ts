import { format, isValid, parseISO } from "date-fns";

import type {
  TCalendarDateInput,
  TCalendarDateKey,
  TCalendarMonthKey,
} from "../calendar.types";

const DATE_KEY_FORMAT = "yyyy-MM-dd";

const toDate = (input: TCalendarDateInput): Date =>
  typeof input === "string" ? parseISO(input) : new Date(input);

/** Ключ дня из даты, ISO-строки или timestamp. Для пустого или невалидного входа — `null`. */
export const toDateKey = (
  input: TCalendarDateInput | null | undefined,
): TCalendarDateKey | null => {
  if (input === null || input === undefined || input === "") {
    return null;
  }
  const d = toDate(input);

  return isValid(d) ? format(d, DATE_KEY_FORMAT) : null;
};

/** Ключ месяца из даты, ISO-строки или timestamp. Для пустого или невалидного входа — `null`. */
export const toMonthKey = (
  input: TCalendarDateInput | null | undefined,
): TCalendarMonthKey | null => {
  const key = toDateKey(input);

  return key ? key.slice(0, 7) : null;
};

export const dateKeyToMonthKey = (key: TCalendarDateKey): TCalendarMonthKey =>
  key.slice(0, 7);

/** Ключ месяца → год и месяц (0–11). */
export const parseMonthKey = (
  key: TCalendarMonthKey,
): { year: number; month: number } => ({
  year: Number(key.slice(0, 4)),
  month: Number(key.slice(5, 7)) - 1,
});

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

export const makeMonthKey = (year: number, month0: number): TCalendarMonthKey =>
  `${year}-${pad2(month0 + 1)}`;

export const makeDateKey = (
  year: number,
  month0: number,
  day: number,
): TCalendarDateKey => `${makeMonthKey(year, month0)}-${pad2(day)}`;

/** Месяц через `delta` месяцев. Простая арифметика по ключу. */
export const addMonths = (
  key: TCalendarMonthKey,
  delta: number,
): TCalendarMonthKey => {
  const { year, month } = parseMonthKey(key);
  const total = year * 12 + month + delta;

  return makeMonthKey(Math.floor(total / 12), ((total % 12) + 12) % 12);
};

/** Сколько месяцев от `from` до `to`. Отрицательное число, если `to` раньше. */
export const diffMonths = (
  from: TCalendarMonthKey,
  to: TCalendarMonthKey,
): number => {
  const a = parseMonthKey(from);
  const b = parseMonthKey(to);

  return (b.year - a.year) * 12 + (b.month - a.month);
};

/** Прижимает месяц к границам `min`/`max`; любая из границ может отсутствовать. */
export const clampMonthKey = (
  key: TCalendarMonthKey,
  min: TCalendarMonthKey | null,
  max: TCalendarMonthKey | null,
): TCalendarMonthKey => {
  if (min && key < min) return min;
  if (max && key > max) return max;

  return key;
};

export const DATE_CACHE_LIMIT = 4096;
const dateCache = new Map<TCalendarDateKey, Date>();

/**
 * `Date` для ключа дня (локальная полночь). Экземпляры кэшируются: стабильная
 * ссылка на `date` позволяет `memo` ячеек не перерисовывать их зря. Экземпляр
 * общий — не мутировать.
 */
export const keyToDate = (key: TCalendarDateKey): Date => {
  const cached = dateCache.get(key);

  if (cached) return cached;

  // Вытесняем самый старый ключ, а не весь кэш: полный сброс менял бы ссылки `date` у всех ячеек разом.
  if (dateCache.size >= DATE_CACHE_LIMIT) {
    const oldest = dateCache.keys().next().value;

    if (oldest !== undefined) dateCache.delete(oldest);
  }
  const { year, month } = parseMonthKey(dateKeyToMonthKey(key));
  const d = new Date(year, month, Number(key.slice(8, 10)));

  dateCache.set(key, d);

  return d;
};

export const monthKeyToDate = (key: TCalendarMonthKey): Date =>
  keyToDate(`${key}-01`);
