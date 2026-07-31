/**
 * Порт DateHelper из IOSChatView: время HH:mm, ключ группы yyyy-MM-dd,
 * заголовок секции (Сегодня/Вчера/день недели/дата).
 */

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const getTimeString = (timestamp: number): string => {
  const d = new Date(timestamp);

  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const getGroupKey = (timestamp: number): string => {
  const d = new Date(timestamp);

  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const DAY_NAMES = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const MONTH_NAMES = [
  "янв.",
  "февр.",
  "мар.",
  "апр.",
  "мая",
  "июн.",
  "июл.",
  "авг.",
  "сент.",
  "окт.",
  "нояб.",
  "дек.",
];

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const getSectionTitle = (groupKey: string): string => {
  const parts = groupKey.split("-");

  if (parts.length !== 3) return groupKey;

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
  );

  if (Number.isNaN(date.getTime())) return groupKey;

  const now = new Date();
  const today = startOfDay(now);
  const target = startOfDay(date);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((today.getTime() - target.getTime()) / dayMs);

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays >= 2 && diffDays <= 6) return DAY_NAMES[date.getDay()];

  const dayMonth = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;

  if (date.getFullYear() === now.getFullYear()) {
    return dayMonth;
  }

  return `${dayMonth} ${date.getFullYear()} г.`;
};
