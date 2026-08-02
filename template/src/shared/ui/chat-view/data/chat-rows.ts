import { IChatFeatures } from "../config";
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
      message: IParsedChatMessage;
      resolvedReply?: IResolvedReply;
      /** Показывать ли имя отправителя. */
      showSenderName: boolean;
      /** Рисовать ли аватар отправителя в ячейке. */
      showAvatar: boolean;
      /** Крупные эмодзи без фона пузыря. */
      bubbleless: boolean;
    }
  | { type: "dateSeparator"; key: string; groupDate: string; hidden: boolean }
  | { type: "loading"; key: string };

/** `localId` даёт pending→real обновление вместо delete+insert. */
const messageRowKey = (message: IParsedChatMessage): string =>
  `m_${message.localId ?? message.id}`;

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
 * Слепок тех и только тех настроек, что попадают в содержимое строки.
 *
 * Сбрасывать кеш по идентичности всего `features` нельзя: хост вправе передать
 * объект литералом, и тогда каждый рендер обнулял бы кеш всех строк — то есть
 * ровно тот случай, ради которого кеш и заведён. Остальные два десятка флагов
 * (FAB, пустое состояние, панель ввода) на строки не влияют.
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
  private _messageRows = new Map<string, IMessageRowCacheEntry>();
  private _separatorRows = new Map<string, ChatRow>();
  private _featuresKey: string | null = null;
  private _indexSource: IParsedChatMessage[] | null = null;
  private _messageIndex = new Map<string, IParsedChatMessage>();
  private readonly _loadingRow: ChatRow = { type: "loading", key: "l_bottom" };

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
      message,
      resolvedReply: replySource && {
        senderName: replySource.senderName ?? "Неизвестный",
        text: replySource.body.text ?? "",
        hasImage: replySource.body.media != null,
      },
      showSenderName,
      showAvatar,
      bubbleless: isBubbleless(message, showSenderName, features),
    };

    into.set(key, { message, replySource, row });

    return row;
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

    const row: ChatRow = { type: "dateSeparator", key, groupDate, hidden };

    into.set(key, row);

    return row;
  }
}
