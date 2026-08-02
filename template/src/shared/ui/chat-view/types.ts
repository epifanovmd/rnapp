import React from "react";
import { HostComponent, ViewProps, ViewStyle } from "react-native";

import type {
  NativeChatAction,
  NativeChatActionPressEventData,
  NativeChatAttachmentPressEventData,
  NativeChatCancelInputActionEventData,
  NativeChatEditMessageEventData,
  NativeChatEmojiReactionSelectData,
  NativeChatFabPressEventData,
  NativeChatFeatures,
  NativeChatFileItem,
  NativeChatImageItem,
  NativeChatInputAction,
  NativeChatInputTypingEventData,
  NativeChatLayoutConfig,
  NativeChatLinkTapEventData,
  NativeChatMessage,
  NativeChatMessagePressEventData,
  NativeChatPhoneNumberTapEventData,
  NativeChatPoll,
  NativeChatPollDetailPressEventData,
  NativeChatPollOption,
  NativeChatPollOptionPressEventData,
  NativeChatReachBottomEventData,
  NativeChatReachTopEventData,
  NativeChatReactionTapEventData,
  NativeChatReplyMessagePressEventData,
  NativeChatReplyRef,
  NativeChatScrollAnchorChangedEventData,
  NativeChatScrollEventData,
  NativeChatSendMessageEventData,
  NativeChatThreadInfo,
  NativeChatThreadTapEventData,
  NativeChatUnreadMessagesAppearEventData,
  NativeChatVideoItem,
  NativeChatViewCommands,
  NativeChatViewProps,
  NativeChatVisibleMessagesChangeEventData,
  NativeChatVoiceItem,
  NativeChatVoiceRecordingCompleteEventData,
} from "./native/NativeChatViewSpec";

// ─── Доменные типы ───────────────────────────────────────────────────────────

export type ChatMessageStatus = "sending" | "sent" | "delivered" | "read";
export type ChatMessageOwnership = "mine" | "theirs" | "system" | "pinned";
export type ChatSenderNameMode = "never" | "incomingOnly" | "always";
export type ChatScrollPosition = "top" | "center" | "bottom";
export type ChatTheme = "light" | "dark";
export type ChatInputActionType = "reply" | "edit" | "none";

export type ChatAction = NativeChatAction;
export type ChatImageItem = NativeChatImageItem;
export type ChatVideoItem = NativeChatVideoItem;
export type ChatVoiceItem = NativeChatVoiceItem;
export type ChatFileItem = NativeChatFileItem;
export type ChatPoll = NativeChatPoll;
export type ChatPollOption = NativeChatPollOption;
export type ChatReplyRef = NativeChatReplyRef;
export type ChatThreadInfo = NativeChatThreadInfo;
export type ChatLayoutConfig = NativeChatLayoutConfig;

export interface ChatFeatures extends Omit<
  NativeChatFeatures,
  "senderNameMode"
> {
  senderNameMode?: ChatSenderNameMode;
}

export interface ChatMessage extends NativeChatMessage {
  status?: ChatMessageStatus;
  ownership?: ChatMessageOwnership;
}

export type ChatInputAction = {
  type: ChatInputActionType;
  messageId?: string;
};

export type { NativeChatInputAction, NativeChatViewProps };

// ─── События ─────────────────────────────────────────────────────────────────

export type ChatScrollEventData = NativeChatScrollEventData;
export type ChatReachTopEventData = NativeChatReachTopEventData;
export type ChatReachBottomEventData = NativeChatReachBottomEventData;
export type ChatVisibleMessagesChangeEventData =
  NativeChatVisibleMessagesChangeEventData;
export type ChatUnreadMessagesAppearEventData =
  NativeChatUnreadMessagesAppearEventData;
export type ChatMessagePressEventData = NativeChatMessagePressEventData;
export type ChatActionPressEventData = NativeChatActionPressEventData;
export type ChatEmojiReactionSelectData = NativeChatEmojiReactionSelectData;
export type ChatSendMessageEventData = NativeChatSendMessageEventData;
export type ChatEditMessageEventData = NativeChatEditMessageEventData;
export type ChatCancelInputActionEventData =
  NativeChatCancelInputActionEventData;
export type ChatAttachmentPressEventData = NativeChatAttachmentPressEventData;
export type ChatReplyMessagePressEventData =
  NativeChatReplyMessagePressEventData;
export type ChatPollOptionPressEventData = NativeChatPollOptionPressEventData;
export type ChatPollDetailPressEventData = NativeChatPollDetailPressEventData;
export type ChatVoiceRecordingCompleteEventData =
  NativeChatVoiceRecordingCompleteEventData;
export type ChatInputTypingEventData = NativeChatInputTypingEventData;
export type ChatReactionTapEventData = NativeChatReactionTapEventData;
export type ChatThreadTapEventData = NativeChatThreadTapEventData;
export type ChatLinkTapEventData = NativeChatLinkTapEventData;
export type ChatPhoneNumberTapEventData = NativeChatPhoneNumberTapEventData;
export type ChatFabPressEventData = NativeChatFabPressEventData;
export type ChatScrollAnchorChangedEventData =
  NativeChatScrollAnchorChangedEventData;

// ─── Команды ─────────────────────────────────────────────────────────────────

export interface ChatViewCommands extends NativeChatViewCommands {
  scrollToMessage(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
    messageId: string,
    position: ChatScrollPosition,
    animated: boolean,
    highlight: boolean,
  ): void;
}

// ─── Императивный интерфейс ──────────────────────────────────────────────────

export interface IChatViewRef {
  /** Прокрутить чат к последнему сообщению. */
  scrollToBottom(): void;
  /** Прокрутить к конкретному сообщению (с опциональной подсветкой). */
  scrollToMessage(
    messageId: string,
    options?: {
      position?: ChatScrollPosition;
      animated?: boolean;
      highlight?: boolean;
    },
  ): void;
  /** Сбросить счётчик непрочитанных. */
  clearUnread(): void;
}

// ─── Якорь скролла ───────────────────────────────────────────────────────────

export interface IChatScrollAnchor {
  /** ID сообщения-якоря (нижнее видимое сообщение). */
  messageId: string;
  /** Расстояние от нижнего края видимой области до нижнего края ячейки (px). */
  offset: number;
  /** Был ли пользователь внизу чата. */
  wasAtBottom: boolean;
}

// ─── Пропсы ──────────────────────────────────────────────────────────────────

export interface ChatViewProps extends ViewProps {
  /** Массив сообщений чата. */
  messages: ChatMessage[];

  /** Формирует actions контекстного меню для каждого сообщения. */
  getActionsForMessage?: (message: ChatMessage) => ChatAction[];

  /** Эмодзи для панели контекстного меню: ["❤️", "👍", "😂"]. */
  emojiReactions?: string[];

  /** Текущее действие панели ввода (ответ/редактирование). */
  inputAction?: ChatInputAction | null;
  /** Pixel-accurate якорь для начального восстановления скролла. */
  initialScrollAnchor?: IChatScrollAnchor;
  /** Расстояние от низа, при котором считается «рядом с низом». */
  scrollToBottomThreshold?: number;
  /** Есть ли более старые сообщения для подгрузки сверху. */
  hasMore?: boolean;
  /** Есть ли более новые сообщения для подгрузки снизу (detached mode). */
  hasNewer?: boolean;

  /** Порог от верха для вызова загрузки старых сообщений (px). */
  topThreshold?: number;
  /** Порог от низа для вызова загрузки новых сообщений (px). */
  bottomThreshold?: number;
  /** Идёт ли начальная загрузка (спиннер в пустом состоянии). */
  isLoading?: boolean;
  /** Текст пустого состояния. */
  emptyStateText?: string;
  /** Идёт ли загрузка старых сообщений сверху. */
  isLoadingTop?: boolean;
  /** Идёт ли загрузка новых сообщений снизу. */
  isLoadingBottom?: boolean;
  /** Спиннер-кольцо на FAB (принудительно показывает FAB). */
  isLoadingFab?: boolean;
  /** Тема оформления: "light" | "dark". */
  theme?: ChatTheme;
  style?: ViewStyle;
  /** Дополнительный верхний отступ списка. */
  collectionInsetTop?: number;
  /** Дополнительный нижний отступ списка. */
  collectionInsetBottom?: number;
  /** Троттлинг событий набора текста (мс). */
  inputTypingThrottle?: number;
  /** Показывать имя отправителя (входящие). */
  showSenderName?: boolean;
  /** Показывать плавающую дату при скролле. */
  showFloatingDate?: boolean;
  /** Количество непрочитанных (-1 = внутреннее управление). */
  unreadCount?: number;

  /** Все флаги функциональности одним объектом (перекрывает отдельные пропсы). */
  features?: ChatFeatures;
  /** Конфигурация размеров/отступов (числовые значения). */
  layout?: ChatLayoutConfig;

  /** Троттлинг снимка видимых сообщений (сек, default 0.3). */
  visibleMessagesThrottleInterval?: number;
  /** Дебаунс непрочитанных сообщений (сек, default 0.3). */
  unreadMessagesDebounceInterval?: number;
  /** Мин. доля видимости ячейки для снимка видимых (0..1, default 0.8). */
  visibilityThreshold?: number;
  /** Мин. доля видимости ячейки для mark-as-read (0..1, default 0.5). */
  unreadVisibilityThreshold?: number;

  onScroll?: (event: ChatScrollEventData) => void;
  onReachTop?: (event: ChatReachTopEventData) => void;
  onReachBottom?: (event: ChatReachBottomEventData) => void;
  /** Снимок видимых на экране сообщений (throttle). */
  onVisibleMessagesChange?: (event: ChatVisibleMessagesChangeEventData) => void;
  /** Непрочитанные сообщения появились на экране (debounce). */
  onUnreadMessagesAppear?: (event: ChatUnreadMessagesAppearEventData) => void;
  onMessagePress?: (event: ChatMessagePressEventData) => void;
  onActionPress?: (event: ChatActionPressEventData) => void;
  onEmojiReactionSelect?: (event: ChatEmojiReactionSelectData) => void;
  onSendMessage?: (event: ChatSendMessageEventData) => void;
  onEditMessage?: (event: ChatEditMessageEventData) => void;
  onCancelInputAction?: (event: ChatCancelInputActionEventData) => void;
  onAttachmentPress?: (event: ChatAttachmentPressEventData) => void;
  onReplyMessagePress?: (event: ChatReplyMessagePressEventData) => void;
  onPollOptionPress?: (event: ChatPollOptionPressEventData) => void;
  onPollDetailPress?: (event: ChatPollDetailPressEventData) => void;
  onVoiceRecordingComplete?: (
    event: ChatVoiceRecordingCompleteEventData,
  ) => void;
  onInputTyping?: (event: ChatInputTypingEventData) => void;
  onReactionTap?: (event: ChatReactionTapEventData) => void;
  onThreadTap?: (event: ChatThreadTapEventData) => void;
  /** Нажатие на ссылку в тексте сообщения. */
  onLinkTap?: (event: ChatLinkTapEventData) => void;
  /** Нажатие на номер телефона в тексте сообщения. */
  onPhoneNumberTap?: (event: ChatPhoneNumberTapEventData) => void;
  onFabPress?: (event: ChatFabPressEventData) => void;
  /** Throttled (~300ms) якорь скролла для сохранения позиции. */
  onScrollAnchorChanged?: (event: ChatScrollAnchorChangedEventData) => void;
}
