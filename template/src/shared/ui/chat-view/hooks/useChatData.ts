import { useMemo, useRef } from "react";

import {
  ChatMessageParser,
  ChatRow,
  ChatRowsBuilder,
  IChatViewFeatures,
  IParsedChatMessage,
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
 * Ключевое свойство обоих преобразований — **сохранение идентичности**:
 * объекты, чьи входные данные не изменились, возвращаются те же самые.
 * От этого напрямую зависит стоимость обновления: список перерисовывает
 * ровно те контейнеры, чьи элементы стали другими (см. `ChatMessageParser`
 * и `ChatRowsBuilder`).
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

export interface IChatDataOptions {
  showDateSeparators: boolean;
  showBottomLoading: boolean;
  hideFirstSeparator: boolean;
}

/** Построение строк и индексов по готовому списку сообщений. */
export const buildChatData = (
  builder: ChatRowsBuilder,
  parsed: IParsedChatMessage[],
  {
    showDateSeparators,
    showBottomLoading,
    hideFirstSeparator,
  }: IChatDataOptions,
): IChatData => {
  const messageIndex = new Map<string, IParsedChatMessage>();

  for (const message of parsed) {
    messageIndex.set(message.id, message);
  }

  const rows = builder.build({
    messages: parsed,
    messageIndex,
    showDateSeparators,
    showBottomLoading,
    hideFirstSeparator,
  });

  const rowIndexById = new Map<string, number>();
  const dateSeparators: IDateSeparatorPosition[] = [];

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
>): IParsedChatMessage[] => {
  const parserRef = useRef<ChatMessageParser | null>(null);

  parserRef.current ??= new ChatMessageParser();

  const parser = parserRef.current;

  return useMemo(
    () => parser.parse(messages, getActionsForMessage),
    [parser, messages, getActionsForMessage],
  );
};

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
  {
    showDateSeparators,
    showBottomLoading,
    hideFirstSeparator,
  }: IChatDataOptions,
): IChatData => {
  const builderRef = useRef<ChatRowsBuilder | null>(null);

  builderRef.current ??= new ChatRowsBuilder();

  const builder = builderRef.current;

  return useMemo(
    () =>
      buildChatData(builder, displayed, {
        showDateSeparators,
        showBottomLoading,
        hideFirstSeparator,
      }),
    [
      builder,
      displayed,
      showDateSeparators,
      showBottomLoading,
      hideFirstSeparator,
    ],
  );
};

/** Пустой снимок для инициализации ref до первого расчёта. */
export const EMPTY_CHAT_DATA: IChatData = buildChatData(
  new ChatRowsBuilder(),
  [],
  {
    showDateSeparators: false,
    showBottomLoading: false,
    hideFirstSeparator: false,
  },
);
