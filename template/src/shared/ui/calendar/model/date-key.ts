import dayjs, { Dayjs } from "dayjs";

import type {
  TCalendarDateInput,
  TCalendarDateKey,
  TCalendarMonthKey,
} from "../calendar.types";

const DATE_KEY_FORMAT = "YYYY-MM-DD";

/** Ключ дня из любого dayjs-входа. Для пустого или невалидного входа — `null`. */
export const toDateKey = (
  input: TCalendarDateInput | null | undefined,
): TCalendarDateKey | null => {
  if (input === null || input === undefined || input === "") {
    return null;
  }
  const d = dayjs(input);

  return d.isValid() ? d.format(DATE_KEY_FORMAT) : null;
};

/** Ключ месяца из любого dayjs-входа. Для пустого или невалидного входа — `null`. */
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

/** Месяц через `delta` месяцев. Простая арифметика, dayjs не нужен. */
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

const DAYJS_CACHE_LIMIT = 4096;
const dayjsCache = new Map<string, Dayjs>();

/**
 * Dayjs для ключа дня в нужной локали. Экземпляры кэшируются: парсинг —
 * самая дорогая операция при построении месяца, а стабильная ссылка на `date`
 * позволяет `memo` ячеек не перерисовывать их зря. Dayjs иммутабелен, делить
 * один экземпляр безопасно.
 */
export const keyToDayjs = (key: TCalendarDateKey, locale: string): Dayjs => {
  const cacheKey = `${locale}|${key}`;
  const cached = dayjsCache.get(cacheKey);

  if (cached) return cached;

  if (dayjsCache.size >= DAYJS_CACHE_LIMIT) {
    dayjsCache.clear();
  }
  const d = dayjs(key).locale(locale);

  dayjsCache.set(cacheKey, d);

  return d;
};

export const monthKeyToDayjs = (
  key: TCalendarMonthKey,
  locale: string,
): Dayjs => keyToDayjs(`${key}-01`, locale);
