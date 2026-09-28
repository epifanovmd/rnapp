import type { IChatMessage } from "@entities/message";

import { messageDayKey } from "./chat-day";

/**
 * Данные списка сообщений: строки, якоря дат и адресация цитат.
 *
 * Чистые функции без React — на них держится и раскладка списка, и тесты.
 */

/** Строка списка: сообщение или разделитель даты. */
export type ChatRow =
  | { type: "message"; key: string; message: IChatMessage }
  | { type: "day"; key: string; dayKey: string };

export interface IChatRows {
  rows: ChatRow[];
  /** Индексы разделителей — якоря прилипания к верхней кромке. */
  dayIndices: number[];
}

/** Высота разделителя даты: пилюля плюс её вертикальные отступы. */
export const CHAT_DAY_ROW_HEIGHT = 40;

/**
 * Стартовая оценка высоты строки — с неё начинается раскладка.
 *
 * Занижать нельзя: по оценке считается положение стартовой позиции, и цель
 * уезжает от каждого замера ровно на разницу с ней. Сообщение — это пузырь с
 * автором, строкой-двумя текста и временем, то есть около сотни точек.
 */
export const CHAT_ESTIMATED_ROW_SIZE = 96;

/**
 * Расстановка разделителей дат между сообщениями разных дней.
 *
 * Возвращает и строки, и индексы якорей: прилипающие элементы список адресует
 * индексами, поэтому считает их тот, кто строит данные.
 */
export const buildChatRows = (messages: readonly IChatMessage[]): IChatRows => {
  const rows: ChatRow[] = [];
  const dayIndices: number[] = [];

  let previousDay: string | undefined;

  for (const message of messages) {
    const dayKey = messageDayKey(message.createdAt);

    if (dayKey !== previousDay) {
      previousDay = dayKey;
      dayIndices.push(rows.length);
      rows.push({ type: "day", key: `day:${dayKey}`, dayKey });
    }

    rows.push({ type: "message", key: message.id, message });
  }

  return { rows, dayIndices };
};

/** Сообщения по id: цитата ищет здесь то, на что отвечают. */
export const indexMessagesById = (
  messages: readonly IChatMessage[],
): Map<string, IChatMessage> =>
  new Map(messages.map(message => [message.id, message]));

/** Ключ строки: переживает вставку и удаление, в отличие от индекса. */
export const chatRowKey = (row: ChatRow): string => row.key;

/**
 * Тип контейнера: строки разной формы не переиспользуют друг друга, а вид
 * содержимого задаёт им форму. Новый вид сообщения получает свой тип сам.
 */
export const chatRowType = (row: ChatRow): string =>
  row.type === "day" ? row.type : `message:${row.message.content.kind}`;

/** Известные высоты: разделители не измеряются, сообщения измеряются. */
export const chatRowFixedSize = (row: ChatRow): number | undefined =>
  row.type === "day" ? CHAT_DAY_ROW_HEIGHT : undefined;
