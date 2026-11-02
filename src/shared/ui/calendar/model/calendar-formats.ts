import {
  format as formatFns,
  getDefaultOptions,
  Locale,
  setDay,
} from "date-fns";
import { enUS } from "date-fns/locale";

import type {
  ICalendarFormats,
  ICalendarWeekDayProps,
  TCalendarFormat,
  TCalendarWeekDay,
} from "../calendar.types";

export const DEFAULT_FORMATS: ICalendarFormats = {
  headerTitle: "LLLL yyyy",
  monthTitle: "LLLL yyyy",
  weekDay: "EEEEEE",
  day: "d",
};

/** Строковый формат — токены date-fns (`LLLL yyyy`, `EEEEEE`, `d`). */
export const formatDate = (
  date: Date,
  format: TCalendarFormat,
  locale: Locale,
): string =>
  typeof format === "function"
    ? format(date)
    : formatFns(date, format, { locale });

export const isWeekendDay = (weekday: TCalendarWeekDay) =>
  weekday === 0 || weekday === 6;

/** Порядок дней недели начиная с `firstDayOfWeek`. */
export const orderedWeekDays = (
  firstDayOfWeek: TCalendarWeekDay,
): TCalendarWeekDay[] =>
  Array.from(
    { length: 7 },
    (_, i) => ((firstDayOfWeek + i) % 7) as TCalendarWeekDay,
  );

const labelsCache = new Map<string, ICalendarWeekDayProps[]>();

/** Подписи дней недели. Кэшируются по локали, формату и первому дню недели — если формат строковый. */
export const getWeekDayLabels = (
  locale: Locale,
  firstDayOfWeek: TCalendarWeekDay,
  format: TCalendarFormat,
): ICalendarWeekDayProps[] => {
  const cacheKey =
    typeof format === "string"
      ? `${locale.code}|${firstDayOfWeek}|${format}`
      : null;

  if (cacheKey) {
    const cached = labelsCache.get(cacheKey);

    if (cached) return cached;
  }

  // Конкретная дата не важна — нужны только названия дней недели.
  const base = new Date(2024, 0, 7);
  const items = orderedWeekDays(firstDayOfWeek).map(weekday => ({
    weekday,
    label: formatDate(setDay(base, weekday), format, locale),
    isWeekend: isWeekendDay(weekday),
  }));

  if (cacheKey) labelsCache.set(cacheKey, items);

  return items;
};

/** Первый день недели из локали. */
export const localeFirstDayOfWeek = (locale: Locale): TCalendarWeekDay =>
  (locale.options?.weekStartsOn ?? 0) as TCalendarWeekDay;

/** Локаль по умолчанию: из `setDefaultOptions` date-fns, иначе en-US. */
export const globalLocale = (): Locale => getDefaultOptions().locale ?? enUS;
