import { IChatFeatures } from "../config";
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
    }
  | {
      type: "dateSeparator";
      key: string;
      itemType: string;
      groupDate: string;
      hidden: boolean;
    }
  | { type: "loading"; key: string; itemType: string };

/** `localId` даёт pending→real обновление вместо delete+insert. */
const messageRowKey = (message: IParsedChatMessage): string =>
  `m_${message.localId ?? message.id}`;

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
  features: IChatFeatures,
): boolean =>
  message.body.emojiCount != null &&
  !showSenderName &&
  !(features.showReplyPreview && message.reply != null) &&
  !(features.showForwardedMark && message.forwardedFrom != null);

export interface IBuildChatRowsInput {
  messages: IParsedChatMessage[];
  features: IChatFeatures;
  showBottomLoading: boolean;
  /** Скрыть первый разделитель, пока сверху крутится спиннер. */
  hideFirstSeparator: boolean;
}

/** Слепок входных данных строки: по нему решается, можно ли её переиспользовать. */
interface IMessageRowCacheEntry {
  message: IParsedChatMessage;
  replySource: IParsedChatMessage | undefined;
  row: ChatRow;
}

/**
 * Построение строк с сохранением идентичности.
 *
 * Строка пересоздаётся, только если изменилось что-то из её входов: само
 * сообщение, сообщение-оригинал цитаты или настройки. Иначе возвращается тот же
 * объект, и список не трогает соответствующий контейнер.
 */
/**
 * Слепок настроек, влияющих на содержимое строк.
 * Инвалидация по всему `features` недопустима — хост может передать новый объект,
 * и кеш всех строк обнулится. Остальные флаги (FAB, input bar, ...) на строки не влияют.
 */
const rowRelevantFeatures = (features: IChatFeatures): string =>
  [
    features.senderNameMode,
    features.showAvatars,
    features.showReplyPreview,
    features.showForwardedMark,
  ].join("|");

export interface IBuildChatRowsResult {
  rows: ChatRow[];
  stickyIndices: number[];
  messageIndex: Map<string, IParsedChatMessage>;
}

export class ChatRowsBuilder {
  private readonly _contentTypes: ChatContentRegistry;
  private _messageRows = new Map<string, IMessageRowCacheEntry>();
  private _separatorRows = new Map<string, ChatRow>();
  private _featuresKey: string | null = null;
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
    features,
    showBottomLoading,
    hideFirstSeparator,
  }: IBuildChatRowsInput): IBuildChatRowsResult {
    const messageIndex = this._messageIndexFor(messages);

    // Кеш недействителен, только если поменялись настройки, влияющие на строку.
    const featuresKey = rowRelevantFeatures(features);

    if (this._featuresKey !== featuresKey) {
      this._featuresKey = featuresKey;
      this._messageRows.clear();
    }

    const rows: ChatRow[] = [];
    // Индексы разделителей уходят в `stickyHeaderIndices` списка: прилипание
    // плашки даты к верхней кромке делает сам список, на UI-потоке.
    const stickyIndices: number[] = [];
    const nextMessageRows = new Map<string, IMessageRowCacheEntry>();
    const nextSeparatorRows = new Map<string, ChatRow>();
    const seenGroups = new Set<string>();

    let isFirstSeparator = true;

    for (const message of messages) {
      if (features.showDateSeparators && !seenGroups.has(message.groupDate)) {
        seenGroups.add(message.groupDate);
        stickyIndices.push(rows.length);
        rows.push(
          this._separatorRow(
            message.groupDate,
            isFirstSeparator && hideFirstSeparator,
            nextSeparatorRows,
          ),
        );
        isFirstSeparator = false;
      }

      rows.push(
        this._messageRow(message, messageIndex, features, nextMessageRows),
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
    features: IChatFeatures,
    into: Map<string, IMessageRowCacheEntry>,
  ): ChatRow {
    const key = messageRowKey(message);
    const replySource = message.reply
      ? messageIndex.get(message.reply.id)
      : undefined;
    const cached = this._messageRows.get(key);

    if (
      cached &&
      cached.message === message &&
      cached.replySource === replySource
    ) {
      into.set(key, cached);

      return cached.row;
    }

    const showSenderName = shouldShowSenderName(
      message,
      features.senderNameMode,
    );
    // Аватар рисуется у каждого входящего сообщения, у которого есть отправитель.
    const showAvatar =
      features.showAvatars &&
      message.ownership === "theirs" &&
      message.senderName != null;

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
      bubbleless: isBubbleless(message, showSenderName, features),
    };

    into.set(key, { message, replySource, row });

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
    into: Map<string, ChatRow>,
  ): ChatRow {
    const key = `d_${groupDate}`;
    const cached = this._separatorRows.get(key);

    if (cached && cached.type === "dateSeparator" && cached.hidden === hidden) {
      into.set(key, cached);

      return cached;
    }

    const row: ChatRow = {
      type: "dateSeparator",
      key,
      itemType: "dateSeparator",
      groupDate,
      hidden,
    };

    into.set(key, row);

    return row;
  }
}
