import { IParsedChatMessage, IResolvedReply } from "./chat-message";

/**
 * Порт ChatRow: message / dateSeparator / loading.
 *
 * Строка — это **готовый к отрисовке** элемент: всё, что ячейке нужно знать
 * о соседях и о других сообщениях (разрешённая цитата, признак якоря
 * аватара, скрытие первого разделителя), посчитано здесь, при построении.
 *
 * Так сделано не ради удобства: `renderItem` вызывается списком лениво и
 * читает актуальную функцию из своих пропов, а контейнер перерисовывается
 * только когда изменился сам элемент. Если бы ячейка добирала данные из
 * замыкания `renderItem` (весь массив строк, индекс сообщений), контейнер,
 * не получивший новый элемент, продолжал бы показывать старый результат.
 */
export type ChatRow =
  | {
      type: "message";
      /** Стабильный ключ строки. Порт `ChatRow.differenceIdentifier`. */
      key: string;
      message: IParsedChatMessage;
      /** Цитата, разрешённая по индексу сообщений. */
      resolvedReply?: IResolvedReply;
      /** Строка — последняя в группе подряд идущих сообщений отправителя. */
      avatarAnchor: boolean;
    }
  | { type: "dateSeparator"; key: string; groupDate: string; hidden: boolean }
  | { type: "loading"; key: string; position: "top" | "bottom" };

/**
 * Порт ChatRow.differenceIdentifier: `localId` (если есть) даёт
 * pending→real обновление вместо delete+insert.
 */
export const chatRowKey = (row: ChatRow): string => row.key;

const messageRowKey = (message: IParsedChatMessage): string =>
  `m_${message.localId ?? message.id}`;

export interface IBuildChatRowsInput {
  messages: IParsedChatMessage[];
  /** ID → сообщение: нужен для разрешения цитат. */
  messageIndex: Map<string, IParsedChatMessage>;
  showDateSeparators: boolean;
  showBottomLoading: boolean;
  /** Скрыть первый разделитель, пока сверху крутится спиннер. */
  hideFirstSeparator: boolean;
}

/** Порт `resolvedReply(for:)`. */
const resolveReply = (
  message: IParsedChatMessage,
  messageIndex: Map<string, IParsedChatMessage>,
): IParsedChatMessage | undefined =>
  message.reply ? messageIndex.get(message.reply.id) : undefined;

/**
 * Порт `computeAvatarGroups()`: эталон считает группы целиком, но ячейке
 * нужен лишь признак «я последний в своей группе».
 */
const isAvatarAnchor = (
  message: IParsedChatMessage,
  next: IParsedChatMessage | undefined,
): boolean =>
  !(
    next != null &&
    next.ownership === "theirs" &&
    message.ownership === "theirs" &&
    next.senderName === message.senderName
  );

/** Слепок входных данных строки: по нему решается, можно ли её переиспользовать. */
interface IMessageRowCacheEntry {
  message: IParsedChatMessage;
  next: IParsedChatMessage | undefined;
  replySource: IParsedChatMessage | undefined;
  row: ChatRow;
}

/**
 * Построение строк с сохранением идентичности. Порт
 * `ChatViewController.buildRows(from:)`.
 *
 * Строка пересоздаётся только если изменилось что-то из того, что в неё
 * входит: само сообщение, следующее сообщение (от него зависит аватар) или
 * сообщение-оригинал цитаты. Иначе возвращается тот же объект — и список
 * не трогает соответствующий контейнер.
 */
export class ChatRowsBuilder {
  private _messageRows = new Map<string, IMessageRowCacheEntry>();
  private _separatorRows = new Map<string, ChatRow>();
  private _loadingRow: ChatRow = {
    type: "loading",
    key: "l_bottom",
    position: "bottom",
  };

  build({
    messages,
    messageIndex,
    showDateSeparators,
    showBottomLoading,
    hideFirstSeparator,
  }: IBuildChatRowsInput): ChatRow[] {
    const rows: ChatRow[] = [];
    const nextMessageRows = new Map<string, IMessageRowCacheEntry>();
    const nextSeparatorRows = new Map<string, ChatRow>();
    const seenGroups = new Set<string>();

    let isFirstSeparator = true;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (showDateSeparators && !seenGroups.has(message.groupDate)) {
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
        this._messageRow(
          message,
          messages[i + 1],
          messageIndex,
          nextMessageRows,
        ),
      );
    }

    if (showBottomLoading) {
      rows.push(this._loadingRow);
    }

    this._messageRows = nextMessageRows;
    this._separatorRows = nextSeparatorRows;

    return rows;
  }

  private _messageRow(
    message: IParsedChatMessage,
    next: IParsedChatMessage | undefined,
    messageIndex: Map<string, IParsedChatMessage>,
    into: Map<string, IMessageRowCacheEntry>,
  ): ChatRow {
    const key = messageRowKey(message);
    const replySource = resolveReply(message, messageIndex);
    const cached = this._messageRows.get(key);

    if (
      cached &&
      cached.message === message &&
      cached.next === next &&
      cached.replySource === replySource
    ) {
      into.set(key, cached);

      return cached.row;
    }

    const row: ChatRow = {
      type: "message",
      key,
      message,
      resolvedReply: replySource && {
        senderName: replySource.senderName ?? "Неизвестный",
        text: replySource.body.text ?? "",
        hasImage: replySource.body.media != null,
      },
      avatarAnchor: isAvatarAnchor(message, next),
    };

    into.set(key, { message, next, replySource, row });

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
