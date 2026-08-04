// NativeChatViewSpec.ts
// Спецификация нативного компонента ChatView с типами для codegen.

import React from "react";
import type { HostComponent, ViewProps } from "react-native";
import { codegenNativeCommands } from "react-native";
import { codegenNativeComponent } from "react-native";
import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";

// ─── Доменные типы ───────────────────────────────────────────────────────────

/** Элемент изображения в сообщении */
export type NativeChatImageItem = {
  /** URL изображения */
  url: string;
  /** Ширина изображения в пикселях */
  width?: Double;
  /** Высота изображения в пикселях */
  height?: Double;
  /** URL миниатюры для предпросмотра */
  thumbnailUrl?: string;
};

/** Элемент видео в сообщении */
export type NativeChatVideoItem = {
  /** URL видеофайла */
  url: string;
  /** URL миниатюры видео */
  thumbnailUrl?: string;
  /** Ширина видео в пикселях */
  width?: Double;
  /** Высота видео в пикселях */
  height?: Double;
  /** Длительность видео в секундах */
  duration?: Double;
};

/** Вариант ответа в опросе */
export type NativeChatPollOption = {
  /** Уникальный идентификатор варианта */
  id: string;
  /** Текст варианта ответа */
  text: string;
  /** Количество голосов за этот вариант */
  votes: Double;
  /** Процент голосов (0..1) */
  percentage: Double;
};

/** Опрос, прикреплённый к сообщению */
export type NativeChatPoll = {
  /** Уникальный идентификатор опроса */
  id: string;
  /** Текст вопроса */
  question: string;
  /** Список вариантов ответа */
  options: NativeChatPollOption[];
  /** Общее количество голосов */
  totalVotes: Double;
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
export type NativeChatVoiceItem = {
  /** URL аудиофайла */
  url: string;
  /** Длительность в секундах */
  duration: Double;
  /** Массив значений амплитуды волны (0..1) для визуализации */
  waveform?: Double[];
};

/** Файловое вложение */
export type NativeChatFileItem = {
  /** URL файла */
  url: string;
  /** Имя файла с расширением */
  name: string;
  /** Размер файла в байтах */
  size: Double;
  /** MIME-тип файла (например "application/pdf") */
  mimeType?: string;
};

/** Реакция на сообщение (эмодзи с счётчиком) */
export type NativeChatReaction = {
  /** Символ эмодзи (например "👍") */
  emoji: string;
  /** Количество пользователей, поставивших эту реакцию */
  count: Double;
  /** Поставлена ли реакция текущим пользователем */
  isSelected?: boolean;
};

/** Ссылка на цитируемое (ответное) сообщение */
export type NativeChatReplyRef = {
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
export type NativeChatAction = {
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
export type NativeChatThreadInfo = {
  /** Уникальный идентификатор треда */
  threadId: string;
  /** Количество ответов в треде */
  replyCount: Double;
  /** Имя последнего ответившего пользователя */
  lastReplierName?: string;
};

/** Сообщение чата */
export type NativeChatMessage = {
  /** Уникальный идентификатор сообщения */
  id: string;
  /** Локальный ID для маппинга pending→real. Оба сообщения (pending и подтверждённое)
   *  должны иметь одинаковый localId, чтобы нативный diff обработал замену как обновление. */
  localId?: string;
  /** Текст сообщения */
  text?: string;
  /** Массив изображений */
  images?: NativeChatImageItem[];
  /** Видео вложение */
  video?: NativeChatVideoItem;
  /** Голосовое сообщение */
  voice?: NativeChatVoiceItem;
  /** Прикреплённый опрос */
  poll?: NativeChatPoll;
  /** Файловое вложение */
  file?: NativeChatFileItem;
  /** Несколько файловых вложений (имеет приоритет над `file`) */
  files?: NativeChatFileItem[];
  /** Реакции на сообщение */
  reactions?: NativeChatReaction[];
  /** Временная метка сообщения (Unix timestamp в миллисекундах) */
  timestamp: Double;
  /** Имя отправителя (для входящих сообщений) */
  senderName?: string;
  /** URL аватарки отправителя */
  senderAvatarUrl?: string;
  /** Тип владения: "mine" | "theirs" | "system" | "pinned" */
  ownership?: string;
  /** Статус доставки: "sending" | "sent" | "delivered" | "read" */
  status?: string;
  /** Ссылка на цитируемое сообщение */
  replyTo?: NativeChatReplyRef;
  /** Имя отправителя пересланного сообщения */
  forwardedFrom?: string;
  /** Было ли сообщение отредактировано */
  isEdited?: boolean;
  /** Информация о треде (обсуждении) */
  thread?: NativeChatThreadInfo;
  /** Действия контекстного меню для этого сообщения */
  actions?: NativeChatAction[];
};

/** Текущее действие панели ввода (ответ/редактирование) */
export type NativeChatInputAction = {
  /** Тип действия: "reply" | "edit" | "none" */
  type: string;
  /** Идентификатор сообщения, к которому применяется действие */
  messageId?: string;
};

// ─── Конфигурация функциональности ──────────────────────────────────────────

/** Флаги функциональности чата — что показывать и как себя вести */
export type NativeChatFeatures = {
  /** Режим отображения имени отправителя: "never" | "incomingOnly" | "always" */
  senderNameMode?: string;
  /** Показывать статус доставки (отправлено/доставлено/прочитано) */
  showMessageStatus?: boolean;
  /** Показывать метку времени */
  showTimestamp?: boolean;
  /** Показывать метку «изменено» */
  showEditedMark?: boolean;
  /** Показывать реакции под сообщением */
  showReactions?: boolean;
  /** Показывать превью цитаты */
  showReplyPreview?: boolean;
  /** Показывать метку «переслано» */
  showForwardedMark?: boolean;
  /** Показывать индикатор треда под сообщением */
  showThreadIndicator?: boolean;
  /** Определять и подсвечивать ссылки и телефоны в тексте сообщений */
  linkDetectionEnabled?: boolean;
  /** Показывать аватарки у входящих сообщений */
  showAvatars?: boolean;
  /** Показывать кнопку скролла вниз (FAB) */
  showFab?: boolean;
  /** Показывать плавающую дату при скролле */
  showFloatingDate?: boolean;
  /** Показывать разделители дат между группами */
  showDateSeparators?: boolean;
  /** Показывать индикатор загрузки сверху */
  showTopLoadingIndicator?: boolean;
  /** Показывать индикатор загрузки снизу */
  showBottomLoadingIndicator?: boolean;
  /** Показывать пустое состояние */
  showEmptyState?: boolean;
  /** Показывать панель ввода */
  showInputBar?: boolean;
  /** Показывать кнопку вложений (скрепка) */
  showAttachButton?: boolean;
  /** Показывать запись голосового сообщения */
  showVoiceRecording?: boolean;
  /** Включить контекстное меню по долгому нажатию */
  contextMenuEnabled?: boolean;
  /** Список эмодзи для быстрых реакций в контекстном меню */
  emojiReactions?: string[];
  /** Порог от верха для вызова загрузки старых сообщений (px) */
  topLoadThreshold?: Double;
  /** Порог от низа для вызова загрузки новых сообщений (px) */
  bottomLoadThreshold?: Double;
  /** Расстояние от низа, при котором считается «рядом с низом» (для FAB и auto-scroll) */
  scrollToBottomThreshold?: Double;
  /** Автоматически скроллить вниз при своём новом сообщении */
  autoScrollOnNewMessage?: boolean;
  /**
   * Эффект рассыпания на частицы при удалении сообщения.
   * Только iOS; на остальных платформах игнорируется.
   */
  disintegrationEnabled?: boolean;
};

/** Конфигурация размеров и отступов (числовые значения, шрифты исключены) */
export type NativeChatLayoutConfig = {
  // ─── Пузырь сообщения ──────────────────────────────────────────────────────
  /** Радиус скругления пузыря */
  bubbleCornerRadius?: Double;
  /** Ширина хвостика пузыря */
  bubbleTailWidth?: Double;
  /** Макс. ширина пузыря как доля ширины экрана (0..1) */
  bubbleMaxWidthRatio?: Double;
  /** Минимальная ширина пузыря */
  bubbleMinWidth?: Double;
  /** Горизонтальный отступ внутри пузыря */
  bubbleHPad?: Double;
  /** Вертикальный отступ сверху внутри пузыря */
  bubbleVPad?: Double;
  /** Отступ снизу пузыря после футера */
  bubbleBottomPad?: Double;
  /** Вертикальный интервал между элементами внутри пузыря */
  bubbleSpacing?: Double;
  /** Интервал между медиа и текстом в смешанном контенте */
  mixedContentSpacing?: Double;

  // ─── Ячейка сообщения ──────────────────────────────────────────────────────
  /** Горизонтальный отступ пузыря от края экрана */
  cellHMargin?: Double;
  /** Вертикальный интервал между ячейками сообщений */
  cellVSpacing?: Double;
  /** Минимальная высота ячейки */
  cellMinHeight?: Double;

  // ─── Футер (время, статус) ─────────────────────────────────────────────────
  /** Высота строки футера */
  footerHeight?: Double;
  /** Интервал между элементами футера */
  footerSpacing?: Double;
  /** Размер иконки статуса доставки */
  statusIconSize?: Double;

  // ─── Превью цитаты ────────────────────────────────────────────────────────
  /** Высота блока превью цитаты */
  replyHeight?: Double;
  /** Ширина акцентной полоски цитаты */
  replyAccentWidth?: Double;
  /** Радиус скругления блока цитаты */
  replyCornerRadius?: Double;

  // ─── Реакции ──────────────────────────────────────────────────────────────
  /** Высота чипа реакции */
  reactionChipHeight?: Double;
  /** Интервал между чипами реакций */
  reactionChipSpacing?: Double;
  /** Горизонтальный отступ внутри чипа реакции */
  reactionChipPadding?: Double;
  /** Ширина рамки чипа моей реакции */
  reactionBorderWidth?: Double;

  // ─── Медиа / изображения ──────────────────────────────────────────────────
  /** Максимальная высота изображения/видео */
  imageMaxHeight?: Double;
  /** Минимальная высота изображения/видео */
  imageMinHeight?: Double;
  /** Радиус скругления изображения/видео */
  imageCornerRadius?: Double;
  /** Интервал между ячейками в сетке медиа */
  mediaGridSpacing?: Double;
  /** Размер иконки воспроизведения в сетке медиа */
  mediaPlayIconSize?: Double;

  // ─── Голосовое сообщение ───────────────────────────────────────────────────
  /** Высота визуализации волны */
  voiceWaveformHeight?: Double;
  /** Ширина полоски волны */
  voiceBarWidth?: Double;
  /** Интервал между полосками волны */
  voiceBarSpacing?: Double;
  /** Размер кнопки воспроизведения голосового */
  voicePlaySize?: Double;
  /** Размер иконки воспроизведения голосового */
  voicePlayIconSize?: Double;
  /** Предпочтительная ширина волны (задаёт ширину пузыря голосового) */
  voiceWaveformWidth?: Double;
  /** Отступ волны от правого края контента */
  voiceWaveformTrailingInset?: Double;
  /** Расстояние между кнопкой воспроизведения и волной */
  voiceContentSpacing?: Double;
  /** Минимальная высота столбика волны */
  voiceBarMinHeight?: Double;

  // ─── Опрос ────────────────────────────────────────────────────────────────
  /** Высота полосы варианта опроса */
  pollBarHeight?: Double;
  /** Радиус скругления полосы варианта */
  pollBarCornerRadius?: Double;
  /** Интервал после заголовка опроса */
  pollHeaderSpacing?: Double;
  /** Интервал между вариантами опроса */
  pollOptionSpacing?: Double;
  /** Внутренний горизонтальный отступ полоски опроса */
  pollBarHPad?: Double;
  /** Длительность анимации прогресса опроса (секунды) */
  pollAnimationDuration?: Double;

  // ─── Файл ─────────────────────────────────────────────────────────────────
  /** Размер иконки файла */
  fileIconSize?: Double;
  /** Интервал между строками файлов */
  fileRowSpacing?: Double;
  /** Интервал между иконкой и текстом в строке файла */
  fileContentSpacing?: Double;
  /** Внутренний отступ карточки файла */
  filePadding?: Double;
  /** Радиус скругления карточки файла */
  fileCornerRadius?: Double;

  // ─── Разделитель дат ──────────────────────────────────────────────────────
  /** Вертикальный отступ разделителя дат */
  dateSeparatorVPad?: Double;
  /** Горизонтальный отступ разделителя дат */
  dateSeparatorHPad?: Double;
  /** Радиус скругления разделителя дат */
  dateSeparatorCornerRadius?: Double;

  // ─── Коллекция ────────────────────────────────────────────────────────────
  /** Верхний отступ контента коллекции */
  collectionTopPadding?: Double;
  /** Нижний отступ под последним сообщением */
  collectionBottomPadding?: Double;
  /** Интервал между секциями дат */
  sectionSpacing?: Double;

  // ─── Панель ввода ─────────────────────────────────────────────────────────
  /** Минимальная высота панели ввода */
  inputBarMinHeight?: Double;
  /** Вертикальный отступ панели ввода */
  inputBarVPad?: Double;
  /** Горизонтальный отступ панели ввода */
  inputBarHPad?: Double;
  /** Минимальная высота поля ввода текста */
  textViewMinHeight?: Double;
  /** Максимальная высота поля ввода до прокрутки */
  textViewMaxHeight?: Double;
  /** Радиус скругления поля ввода текста */
  textViewCornerRadius?: Double;
  /** Высота панели ответа/редактирования */
  inputReplyPanelHeight?: Double;
  /** Размер кнопки вложения/отправки */
  inputButtonSize?: Double;
  /** Высота верхней разделительной линии */
  inputSeparatorHeight?: Double;
  /** Интервал между элементами панели ввода */
  inputStackSpacing?: Double;
  /** Ширина рамки поля ввода */
  inputBorderWidth?: Double;
  /** Размер иконки в кнопках ввода (скрепка, микрофон, отправка) */
  inputIconSize?: Double;
  /** Внутренний отступ кнопки отправки от края контейнера */
  inputSendButtonInset?: Double;
  /** Размер иконки внутренней кнопки отправки */
  inputSendButtonIconSize?: Double;
  /** Ширина акцентной полоски панели ответа */
  inputReplyAccentWidth?: Double;
  /** Отступ placeholder от левого края текстового поля */
  inputPlaceholderLeading?: Double;
  /** Текст placeholder поля ввода */
  inputPlaceholderText?: string;

  // ─── FAB (кнопка скролла вниз) ────────────────────────────────────────────
  /** Диаметр кнопки FAB */
  fabSize?: Double;
  /** Отступ FAB над панелью ввода */
  fabMargin?: Double;
  /** Правый отступ FAB от края экрана */
  fabTrailingMargin?: Double;
  /** Размер иконки стрелки FAB */
  fabArrowSize?: Double;
  /** Непрозрачность тени FAB (0..1) */
  fabShadowOpacity?: Double;
  /** Радиус размытия тени FAB */
  fabShadowRadius?: Double;
  /** Радиус скругления бейджа FAB */
  fabBadgeCornerRadius?: Double;
  /** Высота бейджа FAB */
  fabBadgeHeight?: Double;
  /** Минимальная ширина бейджа FAB */
  fabBadgeMinWidth?: Double;
  /** Горизонтальный отступ внутри бейджа FAB */
  fabBadgePadH?: Double;

  // ─── Тени пузыря ──────────────────────────────────────────────────────────
  /** Непрозрачность тени пузыря (0..1) */
  bubbleShadowOpacity?: Double;
  /** Радиус размытия тени пузыря */
  bubbleShadowRadius?: Double;

  // ─── Анимации ─────────────────────────────────────────────────────────────
  /** Длительность появления плавающей даты (секунды) */
  floatingDateShowDuration?: Double;
  /** Длительность исчезновения плавающей даты (секунды) */
  floatingDateHideDuration?: Double;
  /** Задержка перед автоскрытием плавающей даты (секунды) */
  floatingDateHideDelay?: Double;
  /** Длительность появления подсветки сообщения (секунды) */
  highlightAnimateIn?: Double;
  /** Длительность исчезновения подсветки сообщения (секунды) */
  highlightAnimateOut?: Double;
  /** Задержка перед началом исчезновения подсветки (секунды) */
  highlightDelay?: Double;
  /** Длительность анимации показа/скрытия FAB (секунды) */
  fabAnimationDuration?: Double;

  // ─── Жесты ────────────────────────────────────────────────────────────────
  /** Минимальная длительность долгого нажатия (секунды) */
  longPressDuration?: Double;

  // ─── Пустое состояние ─────────────────────────────────────────────────────
  /** Горизонтальный отступ текста пустого состояния */
  emptyStatePadding?: Double;

  // ─── Скролл ───────────────────────────────────────────────────────────────
  /** Интервал троттлинга событий скролла (секунды) */
  scrollThrottleInterval?: Double;
  /** Интервал дебаунса подгрузки сообщений при скролле (секунды) */
  paginationDebounceInterval?: Double;
};

// ─── Данные событий ──────────────────────────────────────────────────────────

/** Данные события скролла */
export type NativeChatScrollEventData = {
  /** Горизонтальное смещение */
  x: Double;
  /** Вертикальное смещение */
  y: Double;
  /** Находится ли скролл вблизи нижнего края */
  isAtBottom: boolean;
};

/** Данные события достижения верха списка */
export type NativeChatReachTopEventData = {
  /** Расстояние от верхнего края контента */
  distanceFromTop: Double;
};

/** Данные события достижения низа списка */
export type NativeChatReachBottomEventData = {
  /** Расстояние от нижнего края контента */
  distanceFromBottom: Double;
};

/** Данные события изменения видимых сообщений (throttle) */
export type NativeChatVisibleMessagesChangeEventData = {
  /** Снимок видимых на экране сообщений */
  messageIds: string[];
  /** Находится ли скр��лл вблизи нижнего края */
  isAtBottom: boolean;
};

/** Данные события появле��ия непрочитанных сообщений (debounce) */
export type NativeChatUnreadMessagesAppearEventData = {
  /** Накопленные за интервал непрочитанные сообщения */
  messageIds: string[];
};

/** Данные события нажатия на сообщение */
export type NativeChatMessagePressEventData = {
  /** Идентификатор нажатого сообщения */
  messageId: string;
  /** Индекс нажатого вложения (для медиа-сеток) */
  attachmentIndex?: Double;
};

/** Данные события выбора действия контекстного меню */
export type NativeChatActionPressEventData = {
  /** Идентификатор выбранного действия */
  actionId: string;
  /** Идентификатор сообщения */
  messageId: string;
};

/** Данные события выбора эмодзи-реакции из контекстного меню */
export type NativeChatEmojiReactionSelectData = {
  /** Выбранный символ эмодзи */
  emoji: string;
  /** Идентификатор сообщения */
  messageId: string;
};

/** Данные события отправки сообщения */
export type NativeChatSendMessageEventData = {
  /** Текст отправленного сообщения */
  text: string;
  /** Идентификатор сообщения, на которое отвечают */
  replyToId?: string;
};

/** Данные события редактирования сообщения */
export type NativeChatEditMessageEventData = {
  /** Новый текст сообщения */
  text: string;
  /** Идентификатор редактируемого сообщения */
  messageId: string;
};

/** Данные события отмены действия ввода */
export type NativeChatCancelInputActionEventData = {
  /** Тип отменённого действия: "reply" | "edit" */
  type: string;
};

/** Данные события нажатия на кнопку вложений */
export type NativeChatAttachmentPressEventData = {};

/** Данные события нажатия на превью цитаты */
export type NativeChatReplyMessagePressEventData = {
  /** Идентификатор цитируемого сообщения */
  messageId: string;
};

/** Данные события нажатия на вариант опроса */
export type NativeChatPollOptionPressEventData = {
  /** Идентификатор сообщения с опросом */
  messageId: string;
  /** Идентификатор опроса */
  pollId: string;
  /** Идентификатор выбранного варианта */
  optionId: string;
};

/** Данные события нажатия на «Результаты» опроса */
export type NativeChatPollDetailPressEventData = {
  /** Идентификатор сообщения с опросом */
  messageId: string;
  /** Идентификатор опроса */
  pollId: string;
};

/** Данные события завершения записи голосового сообщения */
export type NativeChatVoiceRecordingCompleteEventData = {
  /** URL записанного аудиофайла */
  fileUrl: string;
  /** Длительность записи в секундах */
  duration: Double;
  /** Массив значений амплитуды волны */
  waveform?: Double[];
};

/** Данные события набора текста */
export type NativeChatInputTypingEventData = {
  /** Текущий текст в поле ввода */
  text: string;
};

/** Данные события нажатия на чип реакции */
export type NativeChatReactionTapEventData = {
  /** Символ эмодзи нажатой реакции */
  emoji: string;
  /** Идентификатор сообщения */
  messageId: string;
};

/** Данные события нажатия на индикатор треда */
export type NativeChatThreadTapEventData = {
  /** Идентификатор сообщения с тредом */
  messageId: string;
  /** Идентификатор треда */
  threadId: string;
};

/** Данные события нажатия на ссылку в тексте сообщения */
export type NativeChatLinkTapEventData = {
  /** URL нажатой ссылки */
  url: string;
  /** Идентификатор сообщения, в котором нажали ссылку */
  messageId: string;
};

/** Данные события нажатия на номер телефона в тексте сообщения */
export type NativeChatPhoneNumberTapEventData = {
  /** Номер телефона */
  phoneNumber: string;
  /** Идентификатор сообщения, в котором нажали номер */
  messageId: string;
};

/** Данные события нажатия на кнопку скролла вниз */
export type NativeChatFabPressEventData = {};

export type NativeChatScrollAnchorChangedEventData = {
  /** Message ID of the anchor (top-most visible message). */
  messageId: string;
  /** Distance from visible top to the anchor cell's top edge (px). */
  offset: Double;
  /** Whether user is at the bottom of the chat. */
  wasAtBottom: boolean;
};

// ─── Свойства компонента ─────────────────────────────────────────────────────

export interface NativeChatViewProps extends ViewProps {
  /** Массив сообщений чата */
  messages: NativeChatMessage[];

  /** Есть ли более старые сообщения для подгрузки сверху */
  hasMore?: WithDefault<boolean, false>;
  /** Есть ли более новые сообщения для подгрузки снизу (detached mode) */
  hasNewer?: WithDefault<boolean, false>;

  /** Идёт ли начальная загрузка (показывает спиннер в пустом состоянии) */
  isLoading?: WithDefault<boolean, false>;
  /** Текст пустого состояния (когда нет сообщений и не идёт загрузка) */
  emptyStateText?: WithDefault<string, "">;
  /** Идёт ли загрузка старых сообщений сверху */
  isLoadingTop?: WithDefault<boolean, false>;
  /** Идёт ли загрузка новых сообщений снизу */
  isLoadingBottom?: WithDefault<boolean, false>;
  /** Показывать спиннер-кольцо на FAB-кнопке (принудительно отображает FAB) */
  isLoadingFab?: WithDefault<boolean, false>;
  /** Текущее действие панели ввода (ответ/редактирование) */
  inputAction?: NativeChatInputAction | null;
  /** Pixel-accurate scroll anchor for initial scroll restore. */
  initialScrollAnchor?: Readonly<{
    messageId: string;
    offset: Double;
    wasAtBottom: boolean;
  }>;
  /** Тема оформления: "light" | "dark" */
  theme?: WithDefault<string, "light">;
  /** Дополнительный верхний отступ коллекции */
  collectionInsetTop?: WithDefault<Double, 0>;
  /** Дополнительный нижний отступ коллекции */
  collectionInsetBottom?: WithDefault<Double, 0>;
  /** Интервал троттлинга событий набора текста (мс) */
  inputTypingThrottle?: WithDefault<Double, 500>;
  /** Интервал троттлинга снимка видимых сообщений (секунды) */
  visibleMessagesThrottleInterval?: WithDefault<Double, 0.3>;
  /** Интервал дебаунса непрочитанных сообщений (секунды) */
  unreadMessagesDebounceInterval?: WithDefault<Double, 0.3>;
  /** Минимальная доля видимости ячейки для снимка видимых (0..1) */
  visibilityThreshold?: WithDefault<Double, 0.8>;
  /** Минимальная доля видимости ячейки для mark-as-read (0..1) */
  unreadVisibilityThreshold?: WithDefault<Double, 0.5>;
  /** Количество непрочитанных сообщений (-1 = внутреннее управление) */
  unreadCount?: WithDefault<Double, -1>;

  /** Флаги и пороги поведения чата. */
  features?: NativeChatFeatures;
  /** Конфигурация размеров и отступов (числовые значения, шрифты исключены) */
  layout?: NativeChatLayoutConfig;

  /** Событие скролла */
  onScroll?: DirectEventHandler<NativeChatScrollEventData>;
  /** Достигнут верх списка (для загрузки старых сообщений) */
  onReachTop?: DirectEventHandler<NativeChatReachTopEventData>;
  /** Достигнут низ списка (для загрузки новых сообщений) */
  onReachBottom?: DirectEventHandler<NativeChatReachBottomEventData>;
  /** Снимок видимых на экране сообщений (throttle) */
  onVisibleMessagesChange?: DirectEventHandler<NativeChatVisibleMessagesChangeEventData>;
  /** Непрочитанные сообщения появились на экране (debounce, для mark-as-read) */
  onUnreadMessagesAppear?: DirectEventHandler<NativeChatUnreadMessagesAppearEventData>;
  /** Нажатие на сообщение */
  onMessagePress?: DirectEventHandler<NativeChatMessagePressEventData>;
  /** Выбор действия контекстного меню */
  onActionPress?: DirectEventHandler<NativeChatActionPressEventData>;
  /** Выбор эмодзи-реакции из контекстного меню */
  onEmojiReactionSelect?: DirectEventHandler<NativeChatEmojiReactionSelectData>;
  /** Отправка сообщения */
  onSendMessage?: DirectEventHandler<NativeChatSendMessageEventData>;
  /** Редактирование сообщения */
  onEditMessage?: DirectEventHandler<NativeChatEditMessageEventData>;
  /** Отмена действия ввода (ответ/редактирование) */
  onCancelInputAction?: DirectEventHandler<NativeChatCancelInputActionEventData>;
  /** Нажатие на кнопку вложений */
  onAttachmentPress?: DirectEventHandler<NativeChatAttachmentPressEventData>;
  /** Нажатие на превью цитаты */
  onReplyMessagePress?: DirectEventHandler<NativeChatReplyMessagePressEventData>;
  /** Нажатие на вариант опроса */
  onPollOptionPress?: DirectEventHandler<NativeChatPollOptionPressEventData>;
  /** Нажатие на «Результаты» опроса */
  onPollDetailPress?: DirectEventHandler<NativeChatPollDetailPressEventData>;
  /** Завершение записи голосового сообщения */
  onVoiceRecordingComplete?: DirectEventHandler<NativeChatVoiceRecordingCompleteEventData>;
  /** Набор текста (с троттлингом) */
  onInputTyping?: DirectEventHandler<NativeChatInputTypingEventData>;
  /** Нажатие на чип реакции */
  onReactionTap?: DirectEventHandler<NativeChatReactionTapEventData>;
  /** Нажатие на индикатор треда */
  onThreadTap?: DirectEventHandler<NativeChatThreadTapEventData>;
  /** Нажатие на ссылку в тексте сообщения */
  onLinkTap?: DirectEventHandler<NativeChatLinkTapEventData>;
  /** Нажатие на номер телефона в тексте сообщения */
  onPhoneNumberTap?: DirectEventHandler<NativeChatPhoneNumberTapEventData>;
  /** Нажатие на кнопку скролла вниз */
  onFabPress?: DirectEventHandler<NativeChatFabPressEventData>;
  /** Throttled scroll anchor update (~300ms). Use for scroll position persistence. */
  onScrollAnchorChanged?: DirectEventHandler<NativeChatScrollAnchorChangedEventData>;
}

// ─── Команды ─────────────────────────────────────────────────────────────────

export interface NativeChatViewCommands {
  /** Прокрутить чат к последнему сообщению */
  scrollToBottom(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
  ): void;
  /** Прокрутить к конкретному сообщению */
  scrollToMessage(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
    /** Идентификатор сообщения */
    messageId: string,
    /** Позиция: "top" | "center" | "bottom" */
    position: string,
    /** С анимацией */
    animated: boolean,
    /** Подсветить сообщение после прокрутки */
    highlight: boolean,
  ): void;
  /** Сбросить счётчик непрочитанных */
  clearUnread(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
  ): void;
}

export const Commands = codegenNativeCommands<NativeChatViewCommands>({
  supportedCommands: ["scrollToBottom", "scrollToMessage", "clearUnread"],
});

export default codegenNativeComponent<NativeChatViewProps>(
  "RNChatView",
) as HostComponent<NativeChatViewProps>;
