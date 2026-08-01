import {
  ChatAction,
  ChatFileItem,
  ChatMessage,
  ChatMessageOwnership,
  ChatMessageStatus,
  ChatPoll,
  ChatReplyRef,
  ChatThreadInfo,
} from "../types";
import { getGroupKey } from "./date-helper";

// ─── Медиа-контент (порт AnyChatContent + DefaultContentTypes) ───────────────

export interface IChatMediaItem {
  isVideo: boolean;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export type ChatMediaContent =
  | { type: "images"; items: IChatMediaItem[] }
  | { type: "voice"; url: string; duration: number; waveform: number[] }
  | { type: "poll"; poll: ChatPoll }
  | { type: "files"; items: ChatFileItem[] };

export interface IChatMessageBody {
  text?: string;
  media?: ChatMediaContent;
}

/**
 * Цитата в том виде, в каком её показывает ячейка: имя и текст берутся из
 * оригинального сообщения, а не из сырого `ReplyRef`. Порт `resolvedReply(for:)`.
 *
 * Живёт в модели, а не рядом с `ReplyPreview`: разрешением цитаты занимается
 * построение строк, компоненты его только отрисовывают.
 */
export interface IResolvedReply {
  senderName: string;
  text: string;
  hasImage: boolean;
}

/**
 * Внутренняя модель сообщения — порт ChatMessage (Swift) + ChatParsing.
 */
export interface IParsedChatMessage {
  id: string;
  localId?: string;
  body: IChatMessageBody;
  timestamp: number;
  senderName?: string;
  senderAvatarUrl?: string;
  ownership: ChatMessageOwnership;
  groupDate: string;
  status: ChatMessageStatus;
  reply?: ChatReplyRef;
  forwardedFrom?: string;
  reactions: NonNullable<ChatMessage["reactions"]>;
  thread?: ChatThreadInfo;
  isEdited: boolean;
  actions: ChatAction[];
  /** Исходный элемент props.messages — для getActionsForMessage и коллбэков. */
  raw: ChatMessage;
}

/** Общий пустой список действий — чтобы не плодить массивы на сообщение. */
const EMPTY_ACTIONS: ChatAction[] = [];

const OWNERSHIPS: ChatMessageOwnership[] = [
  "mine",
  "theirs",
  "system",
  "pinned",
];
const STATUSES: ChatMessageStatus[] = ["sending", "sent", "delivered", "read"];

/**
 * Порт ChatMessage.from(dict:) + parseContent: приоритет медиа
 * poll > files > voice > images(+video).
 *
 * `actions` передаются отдельным аргументом, а не подмешиваются в `msg`
 * копией объекта: копия ломала бы идентичность входного сообщения, а на
 * ней держится весь кеш разбора (см. `ChatMessageParser`).
 */
export const parseChatMessage = (
  msg: ChatMessage,
  actions?: ChatAction[],
): IParsedChatMessage => {
  const text = msg.text && msg.text.length > 0 ? msg.text : undefined;

  let media: ChatMediaContent | undefined;

  if (msg.poll) {
    media = { type: "poll", poll: msg.poll };
  } else if (msg.file) {
    media = { type: "files", items: [msg.file] };
  } else if (msg.voice) {
    media = {
      type: "voice",
      url: msg.voice.url,
      duration: msg.voice.duration ?? 0,
      waveform: msg.voice.waveform ?? [],
    };
  } else {
    const items: IChatMediaItem[] = [];

    for (const img of msg.images ?? []) {
      items.push({
        isVideo: false,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl ?? img.url,
        width: img.width,
        height: img.height,
      });
    }
    if (msg.video) {
      items.push({
        isVideo: true,
        url: msg.video.url,
        thumbnailUrl: msg.video.thumbnailUrl,
        width: msg.video.width,
        height: msg.video.height,
        duration: msg.video.duration,
      });
    }
    if (items.length > 0) {
      media = { type: "images", items };
    }
  }

  const ownership = OWNERSHIPS.includes(msg.ownership as ChatMessageOwnership)
    ? (msg.ownership as ChatMessageOwnership)
    : "theirs";
  const status = STATUSES.includes(msg.status as ChatMessageStatus)
    ? (msg.status as ChatMessageStatus)
    : "sent";

  return {
    id: msg.id,
    localId: msg.localId,
    body: { text, media },
    timestamp: msg.timestamp,
    senderName: msg.senderName,
    senderAvatarUrl: msg.senderAvatarUrl,
    ownership,
    groupDate: getGroupKey(msg.timestamp),
    status,
    reply: msg.replyTo,
    forwardedFrom: msg.forwardedFrom,
    reactions: msg.reactions ?? [],
    thread: msg.thread,
    isEdited: msg.isEdited ?? false,
    actions: actions ?? msg.actions ?? EMPTY_ACTIONS,
    raw: msg,
  };
};

export type MessageAlignment = "leading" | "trailing" | "center";

export const messageAlignment = (
  ownership: ChatMessageOwnership,
): MessageAlignment => {
  switch (ownership) {
    case "mine":
      return "trailing";
    case "theirs":
      return "leading";
    default:
      return "center";
  }
};

/** Порт ChatDataSource.shouldShowSenderName. */
export const shouldShowSenderName = (
  msg: IParsedChatMessage,
  mode: "never" | "incomingOnly" | "always",
): boolean => {
  switch (mode) {
    case "never":
      return false;
    case "incomingOnly":
      return msg.ownership === "theirs" && msg.senderName != null;
    case "always":
      return (
        (msg.ownership === "mine" || msg.ownership === "theirs") &&
        msg.senderName != null
      );
  }
};
