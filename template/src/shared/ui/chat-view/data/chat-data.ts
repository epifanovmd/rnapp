import { CHAT_DEFAULT_FEATURES, IChatViewFeatures } from "../config";
import { IParsedChatMessage } from "./chat-message";
import { ChatRow, ChatRowsBuilder } from "./chat-rows";

/**
 * Производные данные списка — порт `buildRows` + `rebuildCachesFromRows` +
 * `rebuildMessageIndex` + `computeAvatarGroups` из `ChatViewController+Data`.
 *
 * Всё, что список и логика скролла знают о сообщениях, собирается здесь и
 * только здесь. Ключевое свойство — сохранение идентичности: объекты, чьи входы
 * не изменились, возвращаются те же самые, поэтому список перерисовывает ровно
 * изменившиеся строки.
 */

/** Позиция разделителя дат в списке строк. Порт `cachedDateSeparators`. */
export interface IDateSeparatorPosition {
  rowIndex: number;
  groupDate: string;
}

/** Группа подряд идущих сообщений одного отправителя — под неё рисуется аватар. */
export interface IChatAvatarGroup {
  key: string;
  firstIndex: number;
  lastIndex: number;
  senderName: string;
  senderAvatarUrl?: string;
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
  /** Группы аватаров в индексах строк. Порт `avatarGroups`. */
  avatarGroups: IChatAvatarGroup[];
}

export interface IChatDataOptions {
  features: IChatViewFeatures;
  showBottomLoading: boolean;
  hideFirstSeparator: boolean;
}

/** Группы подряд идущих входящих сообщений одного отправителя. */
const computeAvatarGroups = (rows: ChatRow[]): IChatAvatarGroup[] => {
  const groups: IChatAvatarGroup[] = [];
  let i = 0;

  while (i < rows.length) {
    const row = rows[i];

    if (
      row.type !== "message" ||
      row.message.ownership !== "theirs" ||
      row.message.senderName == null
    ) {
      i += 1;
      continue;
    }

    const senderName = row.message.senderName;
    let last = i;

    while (last + 1 < rows.length) {
      const next = rows[last + 1];

      if (
        next.type !== "message" ||
        next.message.ownership !== "theirs" ||
        next.message.senderName !== senderName
      ) {
        break;
      }
      last += 1;
    }

    groups.push({
      key: row.key,
      firstIndex: i,
      lastIndex: last,
      senderName,
      senderAvatarUrl: row.message.senderAvatarUrl,
    });
    i = last + 1;
  }

  return groups;
};

/** Собрать строки и индексы по готовому списку сообщений. */
export const buildChatData = (
  builder: ChatRowsBuilder,
  parsed: IParsedChatMessage[],
  { features, showBottomLoading, hideFirstSeparator }: IChatDataOptions,
): IChatData => {
  const messageIndex = new Map<string, IParsedChatMessage>();

  for (const message of parsed) {
    messageIndex.set(message.id, message);
  }

  const rows = builder.build({
    messages: parsed,
    messageIndex,
    features,
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

  return {
    parsed,
    rows,
    messageIndex,
    rowIndexById,
    dateSeparators,
    avatarGroups: features.showAvatars ? computeAvatarGroups(rows) : [],
  };
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
