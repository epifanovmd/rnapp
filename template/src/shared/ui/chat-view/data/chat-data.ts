import { EMPTY_CHAT_CONTENT_REGISTRY } from "../content";
import { IParsedChatMessage } from "./chat-message";
import { ChatRow, ChatRowsBuilder } from "./chat-rows";

/**
 * Производные данные списка: строки и индексы.
 *
 * Всё, что список знает о сообщениях, собирается здесь и только здесь. Ключевое
 * свойство — сохранение идентичности: объекты, чьи входы не изменились,
 * возвращаются те же самые, поэтому список перерисовывает ровно изменившиеся
 * строки.
 */
export interface IChatData {
  /** Разобранные и отсортированные по времени сообщения. */
  messages: IParsedChatMessage[];
  /** Строки списка: сообщения + разделители дат + индикатор загрузки. */
  rows: ChatRow[];
  /** Индексы разделителей дат — для `stickyHeaderIndices` списка. */
  stickyIndices: number[];
  /** ID → сообщение. */
  messageIndex: Map<string, IParsedChatMessage>;
  /**
   * Индекс строки по ID сообщения.
   *
   * Функция, а не готовая карта: её читают только скролл к сообщению и
   * восстановление якоря — единицы раз за сессию. Карта строится при первом
   * обращении, поэтому обычное обновление данных за неё не платит.
   */
  rowIndexOf: (messageId: string) => number | undefined;
}

export interface IBuildChatDataOptions {
  showBottomLoading: boolean;
  hideFirstSeparator: boolean;
  /**
   * Сообщения для строк: `messages` плюс доигрывающие исчезновение. Наружу
   * (`IChatData.messages`) они не попадают — для непрочитанных и видимости
   * удалённого сообщения уже нет.
   */
  rowMessages?: IParsedChatMessage[];
  /** Ключи строк, доигрывающих исчезновение. */
  removingKeys?: ReadonlySet<string> | null;
}

/** Собрать строки и индексы по готовому списку сообщений. */
export const buildChatData = (
  builder: ChatRowsBuilder,
  messages: IParsedChatMessage[],
  {
    showBottomLoading,
    hideFirstSeparator,
    rowMessages,
    removingKeys = null,
  }: IBuildChatDataOptions,
): IChatData => {
  const { rows, stickyIndices, messageIndex } = builder.build({
    messages: rowMessages ?? messages,
    showBottomLoading,
    hideFirstSeparator,
    removingKeys,
  });

  let rowIndex: Map<string, number> | null = null;

  const rowIndexOf = (messageId: string) => {
    if (!rowIndex) {
      rowIndex = new Map();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (row.type === "message") rowIndex.set(row.message.id, i);
      }
    }

    return rowIndex.get(messageId);
  };

  return { messages, rows, stickyIndices, messageIndex, rowIndexOf };
};

/** Пустой снимок для инициализации ссылки на данные до первого расчёта. */
export const EMPTY_CHAT_DATA: IChatData = buildChatData(
  new ChatRowsBuilder(EMPTY_CHAT_CONTENT_REGISTRY),
  [],
  {
    showBottomLoading: false,
    hideFirstSeparator: false,
  },
);
