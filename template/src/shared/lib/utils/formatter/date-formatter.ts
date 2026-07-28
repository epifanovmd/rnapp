import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isAfter,
  isToday,
  parseISO,
} from "date-fns";

import { pluralizeDay, pluralizeHour, pluralizeMinute } from "../pluralize";

type MaybeString = string | null | undefined;

export class DateFormatter {
  /** "d MMMM yyyy, HH:mm" */
  format = (isoString: MaybeString): string => {
    if (!isoString) return "";

    return format(parseISO(isoString), "d MMMM yyyy, HH:mm");
  };

  /** "d MMMM yyyy" */
  formatDate = (isoString: MaybeString): string => {
    if (!isoString) return "";

    return format(parseISO(isoString), "d MMMM yyyy");
  };

  /** "HH:mm:ss" */
  formatTime = (isoString: MaybeString): string => {
    if (!isoString) return "";

    return format(parseISO(isoString), "HH:mm:ss");
  };

  /** "HH:mm:ss" если сегодня, иначе "d MMM, HH:mm:ss" */
  formatChartTime = (isoString: MaybeString): string => {
    if (!isoString) return "";

    const date = parseISO(isoString);

    return format(date, isToday(date) ? "HH:mm:ss" : "d MMM, HH:mm:ss");
  };

  /** "yyyy-MM-dd" (для HTML date input) */
  formatInputDate = (isoString: MaybeString): string => {
    if (!isoString) return "";

    return format(parseISO(isoString), "yyyy-MM-dd");
  };

  /** Относительное время: "3 минуты назад", "вчера", "2 дня назад" */
  formatDiff = (isoString: MaybeString): string => {
    if (!isoString) return "";

    const date = parseISO(isoString);
    const now = new Date();

    if (isToday(date)) {
      const minutes = differenceInMinutes(now, date);

      if (minutes < 1) return "только что";
      if (minutes < 60) return `${pluralizeMinute(minutes, true)} назад`;

      const hours = differenceInHours(now, date);

      return `${pluralizeHour(hours, true)} назад`;
    }

    const days = differenceInDays(now, date);

    if (days <= 1) return "вчера";
    if (days < 7) return `${pluralizeDay(days, true)} назад`;

    return format(date, "d MMMM yyyy");
  };

  /** Формат для списка чатов: "HH:mm" (сегодня), "Пн" (<7 дней), "01.04" (старше) */
  formatChatTime = (isoOrTimestamp: MaybeString | number): string => {
    if (!isoOrTimestamp) return "";

    const date =
      typeof isoOrTimestamp === "number"
        ? new Date(isoOrTimestamp)
        : parseISO(isoOrTimestamp);

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0 && isToday(date)) {
      return format(date, "HH:mm");
    }

    if (diffDays < 7) {
      return format(date, "EEEEEE"); // short weekday (Пн, Вт, ...)
    }

    return format(date, "dd.MM");
  };

  /** true если дата уже прошла */
  isExpired = (isoString: MaybeString): boolean => {
    if (!isoString) return false;

    return isAfter(new Date(), parseISO(isoString));
  };
}
