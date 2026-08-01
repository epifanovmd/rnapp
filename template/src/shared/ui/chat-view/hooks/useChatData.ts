import { useMemo } from "react";

import {
  buildChatRows,
  ChatRow,
  IChatViewFeatures,
  IParsedChatMessage,
  parseChatMessage,
} from "../model";
import { IDateSeparatorPosition } from "../model/floating-date";
import { ChatAction, ChatMessage } from "../types";

/**
 * Производные данные списка — порт `buildRows` + `rebuildCachesFromRows` +
 * `rebuildMessageIndex` из `ChatViewController+Data`.
 *
 * SRP: хук отвечает только за преобразование входных сообщений в строки и
 * индексы. Никакого скролла, никаких эффектов.
 *
 * Все результаты дублируются в ref: обработчики скролла и видимости живут
 * в стабильных колбэках и должны читать актуальные данные, не пересоздаваясь
 * на каждое обновление списка.
 */

export interface IChatDataInput {
  messages: ChatMessage[];
  getActionsForMessage?: (message: ChatMessage) => ChatAction[];
  features: IChatViewFeatures;
  isLoadingBottom: boolean;
}

export interface IChatData {
  /** Разобранные и отсортированные по времени сообщения. */
  parsed: IParsedChatMessage[];
  /** Строки списка: сообщения + разделители дат + индикатор загрузки. */
  rows: ChatRow[];
  /** ID → сообщение. Порт `messageIndex`. */
  messageIndex: Map<string, IParsedChatMessage>;
  /** ID сообщения → индекс строки. Порт `rowIndexCache`. */
  rowIndexById: Map<string, number>;
  /** Позиции разделителей дат. Порт `cachedDateSeparators`. */
  dateSeparators: IDateSeparatorPosition[];
}

/** Построение строк и индексов по готовому списку сообщений. */
export const buildChatData = (
  parsed: IParsedChatMessage[],
  showDateSeparators: boolean,
  showBottomLoading: boolean,
): IChatData => {
  const rows = buildChatRows({
    messages: parsed,
    showDateSeparators,
    showBottomLoading,
  });

  const messageIndex = new Map<string, IParsedChatMessage>();
  const rowIndexById = new Map<string, number>();
  const dateSeparators: IDateSeparatorPosition[] = [];

  for (const message of parsed) {
    messageIndex.set(message.id, message);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (row.type === "message") {
      rowIndexById.set(row.message.id, i);
    } else if (row.type === "dateSeparator") {
      dateSeparators.push({ rowIndex: i, groupDate: row.groupDate });
    }
  }

  return { parsed, rows, messageIndex, rowIndexById, dateSeparators };
};

/** Разбор входных сообщений. Отдельно от строк — меняется реже. */
export const useParsedMessages = ({
  messages,
  getActionsForMessage,
}: Pick<
  IChatDataInput,
  "messages" | "getActionsForMessage"
>): IParsedChatMessage[] =>
  useMemo(() => {
    const source = getActionsForMessage
      ? messages.map(msg => ({ ...msg, actions: getActionsForMessage(msg) }))
      : messages;

    return source
      .map(parseChatMessage)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, getActionsForMessage]);

/**
 * Строки и индексы для уже отображаемых сообщений. Отображаемые отстают от
 * входных на время эффекта распада, поэтому вход здесь — именно они.
 *
 * Ref держит вызывающий, а не хук: `useChatCommands` и `useChatScrollAnchor`
 * создаются раньше данных (им нужен лишь стабильный контейнер), поэтому
 * контейнер обязан существовать до этого хука.
 */
export const useChatData = (
  displayed: IParsedChatMessage[],
  showDateSeparators: boolean,
  showBottomLoading: boolean,
): IChatData =>
  useMemo(
    () => buildChatData(displayed, showDateSeparators, showBottomLoading),
    [displayed, showDateSeparators, showBottomLoading],
  );

/** Пустой снимок для инициализации ref до первого расчёта. */
export const EMPTY_CHAT_DATA: IChatData = buildChatData([], false, false);
