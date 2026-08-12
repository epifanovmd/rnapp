import type { ChatContentBlock, ChatContentRegistry } from "../content";
import {
  ChatAction,
  ChatMessage,
  ChatMessageOwnership,
  ChatMessageStatus,
  ChatReplyRef,
  ChatSenderNameMode,
  ChatThreadInfo,
} from "../types";
import {
  detectChatLinks,
  emojiOnlyCount,
  getGroupKey,
  IChatTextSegment,
} from "../utils";

/**
 * Внутренняя модель сообщения.
 *
 * Разбор делает всю дорогую работу один раз: определяет тип медиа, считает ключ
 * группы, находит ссылки, проверяет «только эмодзи». Компоненты берут готовые
 * значения и не вычисляют ничего в рендере.
 */

export interface IChatMessageBody {
  text?: string;
  /** Блок контента, распознанный реестром типов. */
  media?: ChatContentBlock;
  /** Текст, разбитый на сегменты со ссылками. Пусто — ссылок нет. */
  textSegments?: IChatTextSegment[];
  /** Число эмодзи, если сообщение состоит только из 1–3 эмодзи. */
  emojiCount?: number;
}

/**
 * Цитата в том виде, в каком её показывает ячейка: имя и текст берутся из
 * оригинального сообщения, а не из сырого `ReplyRef`.
 */
export interface IResolvedReply {
  senderName: string;
  text: string;
  /** Описание вложения от дескриптора — показывается, когда текста нет. */
  preview?: string;
}

export interface IParsedChatMessage {
  id: string;
  localId?: string;
  rowKey: string;
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

export const resolveChatActions = (
  msg: ChatMessage,
  actions?: ChatAction[],
): ChatAction[] => actions ?? msg.actions ?? EMPTY_ACTIONS;

const OWNERSHIPS: ChatMessageOwnership[] = [
  "mine",
  "theirs",
  "system",
  "pinned",
];
const STATUSES: ChatMessageStatus[] = ["sending", "sent", "delivered", "read"];

/**
 * Разбор одного сообщения. `actions` приходят отдельным аргументом,
 * чтобы сохранить идентичность `msg` для кеша разбора.
 */
export const parseChatMessage = (
  msg: ChatMessage,
  contentTypes: ChatContentRegistry,
  actions?: ChatAction[],
): IParsedChatMessage => {
  const text = msg.text && msg.text.length > 0 ? msg.text : undefined;
  const media = contentTypes.parse(msg);

  const ownership = OWNERSHIPS.includes(msg.ownership as ChatMessageOwnership)
    ? (msg.ownership as ChatMessageOwnership)
    : "theirs";
  const status = STATUSES.includes(msg.status as ChatMessageStatus)
    ? (msg.status as ChatMessageStatus)
    : "sent";

  // Крупные эмодзи возможны только без медиа; ссылки в таком тексте не ищем.
  const emojiCount = media || !text ? null : emojiOnlyCount(text);
  const segments = text && emojiCount === null ? detectChatLinks(text) : null;

  return {
    id: msg.id,
    localId: msg.localId,
    rowKey: `m_${msg.localId ?? msg.id}`,
    body: {
      text,
      media,
      textSegments: segments ?? undefined,
      emojiCount: emojiCount ?? undefined,
    },
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
    actions: resolveChatActions(msg, actions),
    raw: msg,
  };
};

/** Показывать ли имя отправителя. */
export const shouldShowSenderName = (
  msg: IParsedChatMessage,
  mode: ChatSenderNameMode,
): boolean => {
  if (msg.senderName == null) return false;

  switch (mode) {
    case "never":
      return false;
    case "incomingOnly":
      return msg.ownership === "theirs";
    case "always":
      return msg.ownership === "mine" || msg.ownership === "theirs";
  }
};
