import { AnchorListInitialScroll } from "@epifanovmd/anchor-list";

import { ChatRow } from "./chat-rows";

/**
 * Сохранённая позиция списка и стартовый скролл из неё.
 *
 * Чтение обязано быть синхронным и попасть в первый кадр, поэтому позиция
 * лежит в MMKV, а разбор и сборка стартового скролла — чистые функции.
 */

/**
 * Где список стоял, когда с него ушли.
 *
 * Низ переписки — не строка, а состояние: там появляются новые сообщения, и
 * сохранённая строка к следующему открытию уже не последняя. Плюс позиция
 * строки считается по оценкам всего, что лежит выше неё, и у глубокой строки
 * ошибка копится на сотни точек — список открывается не там. Поэтому конец
 * хранится концом, а строкой — только то, что концом не является.
 */
export type ChatScrollPosition =
  | { type: "end" }
  | {
      type: "row";
      /** Ключ строки, стоявшей у верхней кромки. */
      key: string;
      /** Смещение строки относительно кромки; отрицательное — уходит за неё. */
      offset: number;
    };

/**
 * Смещение строки относительно верхней кромки, со знаком.
 *
 * Отрицательное означает, что строка уходит за кромку, — именно оно возвращает
 * её ровно тем же куском. Округляется до целой точки: нативное смещение
 * приходит квантованным, и цикл «сохранил — восстановил» копит этот квант, а за
 * десяток открытий он превращается в видимый сдвиг.
 */
export const chatScrollOffset = (
  position: number,
  scrollOffset: number,
): number => Math.round(position - scrollOffset);

/** Ключ хранилища для переписки. */
export const chatScrollStorageKey = (chatId: string): string =>
  `chat:scroll:${chatId}`;

export const serializeChatScrollPosition = (
  position: ChatScrollPosition,
): string => JSON.stringify(position);

/** Разбор сохранённого значения; мусор в хранилище — как будто его нет. */
export const parseChatScrollPosition = (
  raw: string | null,
): ChatScrollPosition | undefined => {
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as Partial<{
      type: string;
      key: string;
      offset: number;
    }>;

    if (parsed?.type === "end") return { type: "end" };
    if (parsed?.type !== "row") return undefined;
    if (typeof parsed?.key !== "string") return undefined;
    if (typeof parsed?.offset !== "number") return undefined;

    return { type: "row", key: parsed.key, offset: parsed.offset };
  } catch {
    return undefined;
  }
};

/**
 * Стартовая позиция списка.
 *
 * Строки сохранённой позиции уже нет — открываемся у последнего сообщения, как
 * при первом входе.
 */
export const chatInitialScroll = (
  rows: readonly ChatRow[],
  saved: ChatScrollPosition | undefined,
): AnchorListInitialScroll => {
  if (!saved || saved.type === "end") return { type: "end" };

  const index = rows.findIndex(row => row.key === saved.key);

  if (index === -1) return { type: "end" };

  return { type: "index", index, viewOffset: saved.offset };
};
