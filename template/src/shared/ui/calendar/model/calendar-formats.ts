import dayjs, { Dayjs } from "dayjs";
import localeData from "dayjs/plugin/localeData";

import type {
  ICalendarFormats,
  ICalendarWeekDayProps,
  TCalendarFormat,
  TCalendarWeekDay,
} from "../calendar.types";

dayjs.extend(localeData);

export const DEFAULT_FORMATS: ICalendarFormats = {
  headerTitle: "MMMM YYYY",
  monthTitle: "MMMM YYYY",
  weekDay: "dd",
  day: "D",
};

export const formatDate = (date: Dayjs, format: TCalendarFormat): string =>
  typeof format === "function" ? format(date) : date.format(format);

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
  locale: string,
  firstDayOfWeek: TCalendarWeekDay,
  format: TCalendarFormat,
): ICalendarWeekDayProps[] => {
  const cacheKey =
    typeof format === "string" ? `${locale}|${firstDayOfWeek}|${format}` : null;

  if (cacheKey) {
    const cached = labelsCache.get(cacheKey);

    if (cached) return cached;
  }

  // Конкретная дата не важна — нужны только названия дней недели.
  const base = dayjs("2024-01-07").locale(locale);
  const items = orderedWeekDays(firstDayOfWeek).map(weekday => ({
    weekday,
    label: formatDate(base.day(weekday), format),
    isWeekend: isWeekendDay(weekday),
  }));

  if (cacheKey) labelsCache.set(cacheKey, items);

  return items;
};

/** Первый день недели из локали dayjs. */
export const localeFirstDayOfWeek = (locale: string): TCalendarWeekDay =>
  dayjs().locale(locale).localeData().firstDayOfWeek() as TCalendarWeekDay;

/** Глобальная локаль dayjs. */
export const globalLocale = (): string => dayjs.locale();
