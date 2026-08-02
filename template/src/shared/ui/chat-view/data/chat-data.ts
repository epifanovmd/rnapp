import { CHAT_DEFAULT_FEATURES, IChatFeatures } from "../config";
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
  /** ID сообщения → индекс строки. */
  rowIndexById: Map<string, number>;
}

export interface IBuildChatDataOptions {
  features: IChatFeatures;
  showBottomLoading: boolean;
  hideFirstSeparator: boolean;
}

/** Собрать строки и индексы по готовому списку сообщений. */
export const buildChatData = (
  builder: ChatRowsBuilder,
  messages: IParsedChatMessage[],
  { features, showBottomLoading, hideFirstSeparator }: IBuildChatDataOptions,
): IChatData => {
  const messageIndex = new Map<string, IParsedChatMessage>();

  for (const message of messages) {
    messageIndex.set(message.id, message);
  }

  const { rows, stickyIndices } = builder.build({
    messages,
    messageIndex,
    features,
    showBottomLoading,
    hideFirstSeparator,
  });

  const rowIndexById = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (row.type === "message") rowIndexById.set(row.message.id, i);
  }

  return { messages, rows, stickyIndices, messageIndex, rowIndexById };
};

/** Пустой снимок для инициализации ссылки на данные до первого расчёта. */
export const EMPTY_CHAT_DATA: IChatData = buildChatData(
  new ChatRowsBuilder(),
  [],
  {
    features: CHAT_DEFAULT_FEATURES,
    showBottomLoading: false,
    hideFirstSeparator: false,
  },
);
