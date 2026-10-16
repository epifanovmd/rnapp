import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isAfter,
  isToday,
  isValid,
  isYesterday,
  parseISO,
} from "date-fns";

import { pluralizeDay, pluralizeHour, pluralizeMinute } from "../pluralize";

type MaybeString = string | null | undefined;

/** Дата из ISO-строки; пустая или невалидная строка — `null`. */
const parseDate = (isoString: MaybeString): Date | null => {
  if (!isoString) return null;

  const date = parseISO(isoString);

  return isValid(date) ? date : null;
};

export class DateFormatter {
  /** "d MMMM yyyy, HH:mm" */
  format = (isoString: MaybeString): string => {
    const date = parseDate(isoString);

    return date ? format(date, "d MMMM yyyy, HH:mm") : "";
  };

  /** "d MMMM yyyy" */
  formatDate = (isoString: MaybeString): string => {
    const date = parseDate(isoString);

    return date ? format(date, "d MMMM yyyy") : "";
  };

  /** "HH:mm:ss" */
  formatTime = (isoString: MaybeString): string => {
    const date = parseDate(isoString);

    return date ? format(date, "HH:mm:ss") : "";
  };

  /** "HH:mm:ss" если сегодня, иначе "d MMM, HH:mm:ss" */
  formatChartTime = (isoString: MaybeString): string => {
    const date = parseDate(isoString);

    if (!date) return "";

    return format(date, isToday(date) ? "HH:mm:ss" : "d MMM, HH:mm:ss");
  };

  /** "yyyy-MM-dd" (для HTML date input) */
  formatInputDate = (isoString: MaybeString): string => {
    const date = parseDate(isoString);

    return date ? format(date, "yyyy-MM-dd") : "";
  };

  /** Относительное время: "3 минуты назад", "вчера", "2 дня назад" */
  formatDiff = (isoString: MaybeString): string => {
    const date = parseDate(isoString);

    if (!date) return "";

    const now = new Date();

    if (isToday(date)) {
      const minutes = differenceInMinutes(now, date);

      if (minutes < 1) return "только что";
      if (minutes < 60) return `${pluralizeMinute(minutes, true)} назад`;

      const hours = differenceInHours(now, date);

      return `${pluralizeHour(hours, true)} назад`;
    }

    if (isYesterday(date)) return "вчера";

    const days = differenceInCalendarDays(now, date);

    if (days < 7) return `${pluralizeDay(days, true)} назад`;

    return format(date, "d MMMM yyyy");
  };

  /** true если дата уже прошла */
  isExpired = (isoString: MaybeString): boolean => {
    const date = parseDate(isoString);

    return date ? isAfter(new Date(), date) : false;
  };
}
