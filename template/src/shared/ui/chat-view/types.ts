import { ViewStyle } from "react-native";

// Прямо из модуля, а не из бочки `./content`: там же лежит реестр, и слою
// типов незачем тянуть его за собой.
import type { ChatContentInteraction } from "./content/content-interaction";

/**
 * Публичный контракт чата: доменная модель сообщений и пропсы компонента.
 * Оформление и поведение снаружи не настраиваются — они зашиты в вёрстку.
 */

// ─── Доменная модель ─────────────────────────────────────────────────────────

/** Статус доставки сообщения. */
export type ChatMessageStatus = "sending" | "sent" | "delivered" | "read";
/** Кому принадлежит сообщение — от этого зависит вся раскладка ячейки. */
export type ChatMessageOwnership = "mine" | "theirs" | "system" | "pinned";

/** Элемент изображения в сообщении */
export type ChatImageItem = {
  /** URL изображения */
  url: string;
  /** Ширина изображения в пикселях */
  width?: number;
  /** Высота изображения в пикселях */
  height?: number;
  /** URL миниатюры для предпросмотра */
  thumbnailUrl?: string;
};

/** Элемент видео в сообщении */
export type ChatVideoItem = {
  /** URL видеофайла */
  url: string;
  /** URL миниатюры видео */
  thumbnailUrl?: string;
  /** Ширина видео в пикселях */
  width?: number;
  /** Высота видео в пикселях */
  height?: number;
  /** Длительность видео в секундах */
  duration?: number;
};

/** Вариант ответа в опросе */
export type ChatPollOption = {
  /** Уникальный идентификатор варианта */
  id: string;
  /** Текст варианта ответа */
  text: string;
  /** Количество голосов за этот вариант */
  votes: number;
  /** Процент голосов (0..1) */
  percentage: number;
};

/** Опрос, прикреплённый к сообщению */
export type ChatPoll = {
  /** Уникальный идентификатор опроса */
  id: string;
  /** Текст вопроса */
  question: string;
  /** Список вариантов ответа */
  options: ChatPollOption[];
  /** Общее количество голосов */
  totalVotes: number;
  /** Идентификаторы вариантов, выбранных текущим пользователем */
  selectedOptionIds?: string[];
  /** Разрешён ли множественный выбор */
  isMultipleChoice?: boolean;
  /** Завершён ли опрос */
  isClosed?: boolean;
  /** Анонимный ли опрос */
  isAnonymous?: boolean;
};

/** Голосовое сообщение */
export type ChatVoiceItem = {
  /** URL аудиофайла */
  url: string;
  /** Длительность в секундах */
  duration: number;
  /** Массив значений амплитуды волны (0..1) для визуализации */
  waveform?: number[];
};

/** Файловое вложение */
export type ChatFileItem = {
  /** URL файла */
  url: string;
  /** Имя файла с расширением */
  name: string;
  /** Размер файла в байтах */
  size: number;
  /** MIME-тип файла (например "application/pdf") */
  mimeType?: string;
};

/** Реакция на сообщение (эмодзи с счётчиком) */
export type ChatReaction = {
  /** Символ эмодзи (например "👍") */
  emoji: string;
  /** Количество пользователей, поставивших эту реакцию */
  count: number;
  /** Поставлена ли реакция текущим пользователем */
  isSelected?: boolean;
};

/** Ссылка на цитируемое (ответное) сообщение */
export type ChatReplyRef = {
  /** Идентификатор исходного сообщения */
  id: string;
  /** Текст исходного сообщения (для превью) */
  text?: string;
  /** Имя отправителя исходного сообщения */
  senderName?: string;
  /** Содержит ли исходное сообщение изображения */
  hasImages?: boolean;
};

/** Действие контекстного меню сообщения */
export type ChatAction = {
  /** Уникальный идентификатор действия */
  id: string;
  /** Текст пункта меню */
  title: string;
  /** Имя SF Symbol иконки (iOS) */
  systemImage?: string;
  /** Деструктивное ли действие (красный цвет) */
  isDestructive?: boolean;
};

/** Информация о треде (обсуждении) сообщения */
export type ChatThreadInfo = {
  /** Уникальный идентификатор треда */
  threadId: string;
  /** Количество ответов в треде */
  replyCount: number;
  /** Имя последнего ответившего пользователя */
  lastReplierName?: string;
};

/** Сообщение чата */
export type ChatMessage = {
  /** Уникальный идентификатор сообщения */
  id: string;
  /** Локальный ID для маппинга pending→real. Оба сообщения (pending и подтверждённое)
   *  должны иметь одинаковый localId, чтобы замена считалась обновлением, а не вставкой. */
  localId?: string;
  /** Текст сообщения */
  text?: string;
  /** Массив изображений */
  images?: ChatImageItem[];
  /** Видео вложение */
  video?: ChatVideoItem;
  /** Голосовое сообщение */
  voice?: ChatVoiceItem;
  /** Прикреплённый опрос */
  poll?: ChatPoll;
  /** Файловое вложение */
  file?: ChatFileItem;
  /** Несколько файловых вложений (имеет приоритет над `file`) */
  files?: ChatFileItem[];
  /** Реакции на сообщение */
  reactions?: ChatReaction[];
  /** Временная метка сообщения (Unix timestamp в миллисекундах) */
  timestamp: number;
  /** Имя отправителя (для входящих сообщений) */
  senderName?: string;
  /** URL аватарки отправителя */
  senderAvatarUrl?: string;
  /** Тип владения: "mine" | "theirs" | "system" | "pinned" */
  ownership?: ChatMessageOwnership;
  /** Статус доставки: "sending" | "sent" | "delivered" | "read" */
  status?: ChatMessageStatus;
  /** Ссылка на цитируемое сообщение */
  replyTo?: ChatReplyRef;
  /** Имя отправителя пересланного сообщения */
  forwardedFrom?: string;
  /** Было ли сообщение отредактировано */
  isEdited?: boolean;
  /** Информация о треде (обсуждении) */
  thread?: ChatThreadInfo;
  /** Действия контекстного меню для этого сообщения */
  actions?: ChatAction[];
};

// ─── Типы представления ──────────────────────────────────────────────────────

export type ChatScrollPosition = "top" | "center" | "bottom";
export type ChatInputActionType = "reply" | "edit" | "none";

/** Текущее действие панели ввода. */
export type ChatInputAction = {
  type: ChatInputActionType;
  messageId?: string;
};

/** Результат записи голосового сообщения. */
export type ChatVoiceRecording = {
  /** file:// путь к записанному аудиофайлу. */
  fileUrl: string;
  /** Длительность записи в секундах. */
  duration: number;
  /** Значения амплитуды для волновой формы. */
  waveform?: number[];
};

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

export interface ChatViewProps {
  /** Массив сообщений чата. */
  messages: ChatMessage[];

  /** Формирует actions контекстного меню для каждого сообщения. */
  getActionsForMessage?: (message: ChatMessage) => ChatAction[];

  /** Текущее действие панели ввода (ответ/редактирование). */
  inputAction?: ChatInputAction | null;
  /** Pixel-accurate якорь для начального восстановления скролла. */
  initialScrollAnchor?: IChatScrollAnchor;
  /** Есть ли более старые сообщения для подгрузки сверху. */
  hasMore?: boolean;
  /** Есть ли более новые сообщения для подгрузки снизу (detached mode). */
  hasNewer?: boolean;

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
  /** Количество непрочитанных (-1 = внутреннее управление). */
  unreadCount?: number;
  style?: ViewStyle;

  /** Скролл: смещение по вертикали и близость к низу списка. */
  onScroll?: (offsetY: number, isAtBottom: boolean) => void;
  /** Список докрутили до верха — пора грузить старые сообщения. */
  onReachTop?: () => void;
  /** Список докрутили до низа — пора грузить новые сообщения. */
  onReachBottom?: () => void;
  /** Снимок видимых на экране сообщений (throttle). */
  onVisibleMessagesChange?: (messageIds: string[], isAtBottom: boolean) => void;
  /** Непрочитанные сообщения появились на экране (debounce). */
  onUnreadMessagesAppear?: (messageIds: string[]) => void;
  onMessagePress?: (messageId: string, attachmentIndex?: number) => void;
  onActionPress?: (actionId: string, messageId: string) => void;
  onEmojiReactionSelect?: (emoji: string, messageId: string) => void;
  onSendMessage?: (text: string, replyToId?: string) => void;
  onEditMessage?: (text: string, messageId: string) => void;
  onCancelInputAction?: (type: ChatInputActionType) => void;
  onAttachmentPress?: () => void;
  onReplyMessagePress?: (messageId: string) => void;
  onPollOptionPress?: (
    messageId: string,
    pollId: string,
    optionId: string,
  ) => void;
  onPollDetailPress?: (messageId: string, pollId: string) => void;
  /**
   * Взаимодействие с блоком контента.
   *
   * Сюда приходят события всех типов, включая добавленные приложением.
   * Встроенные типы дополнительно продолжают вызывать свои коллбэки выше.
   */
  onContentInteraction?: (event: ChatContentInteraction) => void;
  onVoiceRecordingComplete?: (recording: ChatVoiceRecording) => void;
  onInputTyping?: (text: string) => void;
  onReactionTap?: (emoji: string, messageId: string) => void;
  onThreadTap?: (messageId: string, threadId: string) => void;
  /** Нажатие на ссылку в тексте сообщения. */
  onLinkTap?: (url: string, messageId: string) => void;
  /** Нажатие на номер телефона в тексте сообщения. */
  onPhoneNumberTap?: (phoneNumber: string, messageId: string) => void;
  onFabPress?: () => void;
  /** Throttled (~300ms) якорь скролла для сохранения позиции. */
  onScrollAnchorChanged?: (anchor: IChatScrollAnchor) => void;
}
