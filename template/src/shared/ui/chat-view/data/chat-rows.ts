import type { ChatContentRegistry } from "../content";
import {
  IParsedChatMessage,
  IResolvedReply,
  shouldShowSenderName,
} from "./chat-message";

/**
 * Строка списка: сообщение, разделитель дат или индикатор загрузки.
 *
 * Строка **готова к отрисовке**: всё, что ячейке нужно знать о соседях и о
 * настройках (разрешённая цитата, показ имени, режим крупных эмодзи), посчитано
 * здесь. Компонент строки принимает только её и потому реально мемоизируется:
 * `renderItem` вызывается лениво и не должен замыкаться на массив данных.
 */
export type ChatRow =
  | {
      type: "message";
      /** Стабильный ключ. */
      key: string;
      /**
       * Тип контейнера для переиспользования (`getItemType` списка).
       *
       * Дробнее, чем `type`: список сначала ищет контейнер того же типа, и
       * попадание означает, что у переиспользуемой ячейки уже та же структура
       * поддерева — React меняет пропы вместо размонтирования и монтирования.
       * Текст, попавший в контейнер из-под фото, стоит куда дороже.
       */
      itemType: string;
      message: IParsedChatMessage;
      resolvedReply?: IResolvedReply;
      /** Показывать ли имя отправителя. */
      showSenderName: boolean;
      /** Рисовать ли аватар отправителя в ячейке. */
      showAvatar: boolean;
      /** Крупные эмодзи без фона пузыря. */
      bubbleless: boolean;
      /** Строка уже удалена из данных и доигрывает исчезновение. */
      removing: boolean;
    }
  | {
      type: "dateSeparator";
      key: string;
      itemType: string;
      groupDate: string;
      hidden: boolean;
      /** Все сообщения дня исчезают — плашка уходит вместе с ними. */
      removing: boolean;
    }
  | { type: "loading"; key: string; itemType: string };

/** Ключ строки посчитан один раз при разборе — здесь только чтение. */
export const chatMessageRowKey = (message: IParsedChatMessage): string =>
  message.rowKey;

/**
 * Тип контейнера сообщения: принадлежность плюс род контента.
 *
 * Принадлежность — потому что от неё зависит сама разметка ячейки (колонка под
 * аватар, сторона прижатия), род контента — потому что от него зависит
 * поддерево пузыря. Дробить мельче смысла нет: чем больше типов, тем чаще
 * список не находит свободный контейнер нужного и берёт чужой.
 */
const messageItemType = (
  message: IParsedChatMessage,
  contentTypes: ChatContentRegistry,
): string => {
  const { media, emojiCount } = message.body;
  let content: string;

  if (media) {
    const contentType = contentTypes.get(media.type);

    content = contentType?.recycleKey?.(media) ?? media.type;
  } else {
    content = emojiCount != null ? "emoji" : "text";
  }

  return `m:${message.ownership}:${content}`;
};

/** Крупные эмодзи без пузыря, но имя, цитата и заголовок пересылки требуют пузыря. */
const isBubbleless = (
  message: IParsedChatMessage,
  showSenderName: boolean,
): boolean =>
  message.body.emojiCount != null &&
  !showSenderName &&
  message.reply == null &&
  message.forwardedFrom == null;

export interface IBuildChatRowsInput {
  messages: IParsedChatMessage[];
  showBottomLoading: boolean;
  /** Скрыть первый разделитель, пока сверху крутится спиннер. */
  hideFirstSeparator: boolean;
  /** Ключи строк, доигрывающих исчезновение; `null` — таких нет. */
  removingKeys: ReadonlySet<string> | null;
}

/** Слепок входных данных строки: по нему решается, можно ли её переиспользовать. */
interface IMessageRowCacheEntry {
  message: IParsedChatMessage;
  replySource: IParsedChatMessage | undefined;
  removing: boolean;
  row: ChatRow;
}

/**
 * Дни, у которых не осталось ни одного живого сообщения. Плашка такого дня
 * исчезает вместе с ними, иначе она мигнула бы одна посреди списка.
 */
const fullyRemovedGroups = (
  messages: IParsedChatMessage[],
  removingKeys: ReadonlySet<string>,
): Set<string> => {
  const groups = new Set<string>();
  const alive = new Set<string>();

  for (const message of messages) {
    groups.add(message.groupDate);

    if (!removingKeys.has(chatMessageRowKey(message))) {
      alive.add(message.groupDate);
    }
  }

  for (const group of alive) groups.delete(group);

  return groups;
};

/**
 * Построение строк с сохранением идентичности.
 *
 * Строка пересоздаётся, только если изменилось что-то из её входов: само
 * сообщение, сообщение-оригинал цитаты или настройки. Иначе возвращается тот же
 * объект, и список не трогает соответствующий контейнер.
 */
export interface IBuildChatRowsResult {
  rows: ChatRow[];
  stickyIndices: number[];
  messageIndex: Map<string, IParsedChatMessage>;
}

export class ChatRowsBuilder {
  private readonly _contentTypes: ChatContentRegistry;
  private _messageRows = new Map<string, IMessageRowCacheEntry>();
  private _separatorRows = new Map<string, ChatRow>();
  private _indexSource: IParsedChatMessage[] | null = null;
  private _messageIndex = new Map<string, IParsedChatMessage>();
  private readonly _loadingRow: ChatRow = {
    type: "loading",
    key: "l_bottom",
    itemType: "loading",
  };

  constructor(contentTypes: ChatContentRegistry) {
    this._contentTypes = contentTypes;
  }

  build({
    messages,
    showBottomLoading,
    hideFirstSeparator,
    removingKeys,
  }: IBuildChatRowsInput): IBuildChatRowsResult {
    const messageIndex = this._messageIndexFor(messages);
    const removedGroups = removingKeys
      ? fullyRemovedGroups(messages, removingKeys)
      : null;

    const rows: ChatRow[] = [];
    // Индексы разделителей уходят в `stickyHeaderIndices` списка: прилипание
    // плашки даты к верхней кромке делает сам список, на UI-потоке.
    const stickyIndices: number[] = [];
    const nextMessageRows = new Map<string, IMessageRowCacheEntry>();
    const nextSeparatorRows = new Map<string, ChatRow>();
    const seenGroups = new Set<string>();

    let isFirstSeparator = true;

    for (const message of messages) {
      if (!seenGroups.has(message.groupDate)) {
        seenGroups.add(message.groupDate);
        stickyIndices.push(rows.length);
        rows.push(
          this._separatorRow(
            message.groupDate,
            isFirstSeparator && hideFirstSeparator,
            removedGroups?.has(message.groupDate) ?? false,
            nextSeparatorRows,
          ),
        );
        isFirstSeparator = false;
      }

      rows.push(
        this._messageRow(
          message,
          messageIndex,
          removingKeys?.has(chatMessageRowKey(message)) ?? false,
          nextMessageRows,
        ),
      );
    }

    if (showBottomLoading) rows.push(this._loadingRow);

    this._messageRows = nextMessageRows;
    this._separatorRows = nextSeparatorRows;

    return { rows, stickyIndices, messageIndex };
  }

  private _messageIndexFor(
    messages: IParsedChatMessage[],
  ): Map<string, IParsedChatMessage> {
    if (this._indexSource === messages) return this._messageIndex;

    const index = new Map<string, IParsedChatMessage>();

    for (const message of messages) {
      index.set(message.id, message);
    }

    this._indexSource = messages;
    this._messageIndex = index;

    return index;
  }

  private _messageRow(
    message: IParsedChatMessage,
    messageIndex: Map<string, IParsedChatMessage>,
    removing: boolean,
    into: Map<string, IMessageRowCacheEntry>,
  ): ChatRow {
    const key = chatMessageRowKey(message);
    const replySource = message.reply
      ? messageIndex.get(message.reply.id)
      : undefined;
    const cached = this._messageRows.get(key);

    if (
      cached &&
      cached.message === message &&
      cached.replySource === replySource &&
      cached.removing === removing
    ) {
      into.set(key, cached);

      return cached.row;
    }

    const showSenderName = shouldShowSenderName(message);
    // Аватар рисуется у каждого входящего сообщения, у которого есть отправитель.
    const showAvatar =
      message.ownership === "theirs" && message.senderName != null;

    const row: ChatRow = {
      type: "message",
      key,
      itemType: messageItemType(message, this._contentTypes),
      message,
      resolvedReply: replySource && {
        senderName: replySource.senderName ?? "Неизвестный",
        text: replySource.body.text ?? "",
        preview: this._contentPreview(replySource),
      },
      showSenderName,
      showAvatar,
      bubbleless: isBubbleless(message, showSenderName),
      removing,
    };

    into.set(key, { message, replySource, removing, row });

    return row;
  }

  /** Описание вложения сообщения от дескриптора его типа. */
  private _contentPreview(message: IParsedChatMessage): string | undefined {
    const media = message.body.media;

    if (!media) return undefined;

    return this._contentTypes.get(media.type)?.preview?.(media);
  }

  private _separatorRow(
    groupDate: string,
    hidden: boolean,
    removing: boolean,
    into: Map<string, ChatRow>,
  ): ChatRow {
    const key = `d_${groupDate}`;
    const cached = this._separatorRows.get(key);

    if (
      cached &&
      cached.type === "dateSeparator" &&
      cached.hidden === hidden &&
      cached.removing === removing
    ) {
      into.set(key, cached);

      return cached;
    }

    const row: ChatRow = {
      type: "dateSeparator",
      key,
      itemType: "dateSeparator",
      groupDate,
      hidden,
      removing,
    };

    into.set(key, row);

    return row;
  }
}
