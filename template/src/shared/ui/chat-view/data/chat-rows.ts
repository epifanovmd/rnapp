import { IChatViewFeatures } from "../config";
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
      /** Крупные эмодзи без фона пузыря. */
      bubbleless: boolean;
    }
  | { type: "dateSeparator"; key: string; groupDate: string; hidden: boolean }
  | { type: "loading"; key: string; position: "top" | "bottom" };

export const chatRowKey = (row: ChatRow): string => row.key;

/** `localId` даёт pending→real обновление вместо delete+insert. */
const messageRowKey = (message: IParsedChatMessage): string =>
  `m_${message.localId ?? message.id}`;

/** Крупные эмодзи без пузыря, но имя, цитата и заголовок пересылки требуют пузыря. */
const isBubbleless = (
  message: IParsedChatMessage,
  showSenderName: boolean,
  features: IChatViewFeatures,
): boolean =>
  message.body.emojiCount != null &&
  !showSenderName &&
  !(features.showReplyPreview && message.reply != null) &&
  !(features.showForwardedMark && message.forwardedFrom != null);

export interface IBuildChatRowsInput {
  messages: IParsedChatMessage[];
  /** ID → сообщение: нужен для разрешения цитат. */
  messageIndex: Map<string, IParsedChatMessage>;
  features: IChatViewFeatures;
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
export class ChatRowsBuilder {
  private _messageRows = new Map<string, IMessageRowCacheEntry>();
  private _separatorRows = new Map<string, ChatRow>();
  private _features: IChatViewFeatures | null = null;
  private readonly _loadingRow: ChatRow = {
    type: "loading",
    key: "l_bottom",
    position: "bottom",
  };

  build({
    messages,
    messageIndex,
    features,
    showBottomLoading,
    hideFirstSeparator,
  }: IBuildChatRowsInput): ChatRow[] {
    // Настройки участвуют в содержимом строки — при их смене кеш недействителен.
    if (this._features !== features) {
      this._features = features;
      this._messageRows.clear();
    }

    const rows: ChatRow[] = [];
    const nextMessageRows = new Map<string, IMessageRowCacheEntry>();
    const nextSeparatorRows = new Map<string, ChatRow>();
    const seenGroups = new Set<string>();

    let isFirstSeparator = true;

    for (const message of messages) {
      if (features.showDateSeparators && !seenGroups.has(message.groupDate)) {
        seenGroups.add(message.groupDate);
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

    return rows;
  }

  private _messageRow(
    message: IParsedChatMessage,
    messageIndex: Map<string, IParsedChatMessage>,
    features: IChatViewFeatures,
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
