import { Platform, TextStyle } from "react-native";

/**
 * Форматирование текста чата: порт DateHelper, EmojiHelper, formatTime и
 * ByteCountFormatter из IOSChatView.
 */

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Время сообщения в формате HH:mm. */
export const getTimeString = (timestamp: number): string => {
  const d = new Date(timestamp);

  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/** Ключ группы сообщений (yyyy-MM-dd) — по нему строятся разделители дат. */
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

/** Заголовок разделителя дат: Сегодня / Вчера / день недели / дата. */
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
  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays >= 2 && diffDays <= 6) return DAY_NAMES[date.getDay()];

  const dayMonth = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;

  return date.getFullYear() === now.getFullYear()
    ? dayMonth
    : `${dayMonth} ${date.getFullYear()} г.`;
};

/** Длительность в формате m:ss. */
export const formatChatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  const secs = total % 60;

  return `${Math.floor(total / 60)}:${secs < 10 ? `0${secs}` : secs}`;
};

/** Размер файла в человекочитаемом виде (порт ByteCountFormatter .file). */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1000) return `${bytes} байт`;

  const units = ["КБ", "МБ", "ГБ", "ТБ"];
  let value = bytes;
  let unit = -1;

  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }

  const rounded =
    value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;

  return `${rounded} ${units[unit]}`;
};

/** Русская плюрализация «N ответов» для индикатора треда. */
export const threadReplyCountLabel = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 19) return `${count} ответов`;
  if (mod10 === 1) return `${count} ответ`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} ответа`;

  return `${count} ответов`;
};

const EMOJI_ONLY_RE =
  /^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*|\p{Regional_Indicator}{2})+$/u;

const EMOJI_GRAPHEME_RE =
  /\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*|\p{Regional_Indicator}{2}/gu;

/**
 * Число эмодзи, если текст состоит только из 1–3 эмодзи (порт
 * EmojiHelper.emojiOnlyCount) — такое сообщение рисуется крупно и без пузыря.
 */
export const emojiOnlyCount = (text: string | undefined): number | null => {
  if (!text) return null;
  if (!EMOJI_ONLY_RE.test(text)) return null;

  const count = text.match(EMOJI_GRAPHEME_RE)?.length ?? 0;

  return count >= 1 && count <= 3 ? count : null;
};

/**
 * Базовый стиль любого текста чата.
 *
 * Метрики порта взяты из iOS (высоты цитаты, футера, чипов реакций), а Android
 * по умолчанию добавляет к строке отступы шрифта — в контейнерах фиксированной
 * высоты это обрезает текст. Отключаем, чтобы высоты совпадали.
 */
export const chatTextBase: TextStyle = Platform.select({
  android: { includeFontPadding: false },
  default: {},
}) as TextStyle;

/** rgba-обёртка поверх цвета темы в формате `rgb(...)` или `#rrggbb`. */
export const withOpacity = (color: string, opacity: number): string => {
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  }
  if (color.startsWith("#") && color.length === 7) {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0");

    return `${color}${alpha}`;
  }

  return color;
};
