import type { TimeTickUnit } from "./time-ticks";

const MONTHS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

const MONTHS_TITLE = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

const pad2 = (value: number) => String(value).padStart(2, "0");

const dayMonth = (date: Date) =>
  `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;

/**
 * Подпись временного деления по единице шага: время — для часов и минут
 * (полночь — дата), дата — для дней и недель, месяц — для месяцев (январь —
 * год), год — для лет.
 */
export const formatTimeTick = (value: number, unit?: TimeTickUnit): string => {
  const date = new Date(value);
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const isMidnight =
    date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;

  switch (unit) {
    case "second":
      return `${time}:${pad2(date.getSeconds())}`;
    case "minute":
    case "hour":
      return isMidnight ? dayMonth(date) : time;
    case "day":
    case "week":
      return dayMonth(date);
    case "month":
      return date.getMonth() === 0
        ? String(date.getFullYear())
        : MONTHS_TITLE[date.getMonth()];
    case "year":
      return String(date.getFullYear());
    default:
      return isMidnight ? dayMonth(date) : `${dayMonth(date)}, ${time}`;
  }
};
