import { StyleProp, ViewStyle } from "react-native";

export type MessageStatus = "sent" | "received" | "read";
export type MessageDirection = "incoming" | "outgoing";

export interface ChatUser {
  // id пользователя
  id: number;
  // имя пользователя для отображения
  displayName: string;
}

export type MessageData =
  | { type: "text"; text: string }
  | { type: "image"; image: string | { uri: string } }
  | { type: "system"; text: string };

export interface RawMessage {
  // уникальный id сообщения
  id: string;
  // время сообщения (timestamp в мс)
  date: number;
  // пользователь, которому принадлежит сообщение
  user: ChatUser;
  // статус сообщения (для исходящих)
  status?: MessageStatus;
  // направление (incoming/outgoing). Если не задано, определяется по userId
  direction?: MessageDirection;
  // ссылка на сообщение, на которое отвечаем
  replyToId?: string;
  // данные сообщения
  data: MessageData;
}

export interface ScrollEvent {
  contentOffset: { x: number; y: number };
  contentSize: { width: number; height: number };
}

export interface ChatEdgeInsets {
  // отступ сверху
  top?: number;
  // отступ справа
  right?: number;
  // отступ снизу
  bottom?: number;
  // отступ слева
  left?: number;
}

export interface ChatLayoutConfig {
  // максимальная ширина сообщения относительно экрана
  maxMessageWidthRatio?: number;
  // размер хвоста пузыря
  tailSize?: number;
  // радиус пузыря
  bubbleCornerRadius?: number;
  // расстояние между сообщениями
  interItemSpacing?: number;
  // расстояние между секциями (днями)
  interSectionSpacing?: number;
  // общие отступы контента чата
  contentInsets?: ChatEdgeInsets;
  // внутренние отступы внутри пузыря
  bubbleContentInsets?: ChatEdgeInsets;
  // отступы у разделителя даты
  dateSeparatorInsets?: ChatEdgeInsets;
  // отступы оверлея у медиа сообщений
  mediaOverlayInsets?: ChatEdgeInsets;
  // отступы системных сообщений
  systemMessageInsets?: ChatEdgeInsets;
  // отступы превью ответа
  replyPreviewInsets?: ChatEdgeInsets;
}

export interface ChatColorsConfig {
  // фон чата
  background?: string | number;
  // фон входящих сообщений
  incomingBubble?: string | number;
  // фон исходящих сообщений
  outgoingBubble?: string | number;
  // цвет текста входящих
  incomingText?: string | number;
  // цвет текста исходящих
  outgoingText?: string | number;
  // цвет ссылок входящих
  incomingLink?: string | number;
  // цвет ссылок исходящих
  outgoingLink?: string | number;
  // цвет текста даты
  dateSeparatorText?: string | number;
  // цвет обводки даты
  dateSeparatorBorder?: string | number;
  // фон даты
  dateSeparatorBackground?: string | number;
  // цвет имени пользователя
  messageSenderText?: string | number;
  // цвет времени
  messageTimeText?: string | number;
  // фон оверлея на медиа
  mediaOverlayBackground?: string | number;
  // цвет статуса "отправлено"
  statusSent?: string | number;
  // цвет статуса "доставлено"
  statusReceived?: string | number;
  // цвет статуса "прочитано"
  statusRead?: string | number;
  // фон плейсхолдера медиа
  mediaPlaceholderBackground?: string | number;
  // цвет текста системных сообщений
  systemMessageText?: string | number;
  // фон системных сообщений
  systemMessageBackground?: string | number;
  // обводка системных сообщений
  systemMessageBorder?: string | number;
  // фон превью ответа
  replyPreviewBackground?: string | number;
  // текст превью ответа
  replyPreviewText?: string | number;
  // текст автора превью ответа
  replyPreviewSenderText?: string | number;
  // обводка превью ответа
  replyPreviewBorder?: string | number;
  // подсветка при скролле
  scrollHighlight?: string | number;
}

export type FontSpec =
  | number
  | { size?: number; weight?: string; name?: string };

export interface ChatFontsConfig {
  // шрифт текста сообщения
  message?: FontSpec;
  // шрифт даты
  dateSeparator?: FontSpec;
  // шрифт заголовка группы
  groupTitle?: FontSpec;
  // шрифт имени пользователя
  messageSender?: FontSpec;
  // шрифт статуса
  messageStatus?: FontSpec;
  // шрифт времени
  messageTime?: FontSpec;
  // шрифт системных сообщений
  systemMessage?: FontSpec;
}

export interface ChatBehaviorConfig {
  // показывать хвостик у пузырей
  showsBubbleTail?: boolean;
  // логика показа имени: always | first | none
  nameDisplayMode?: "always" | "first" | "none";
  // показывать статусы у исходящих
  showsStatus?: boolean;
  // текст для неподдерживаемого типа
  unsupportedMessageText?: string;
  // показывать время внутри сообщения
  showsMessageTime?: boolean;
  // показывать превью ответа
  showsReplyPreview?: boolean;
  // подсветка сообщения после скролла
  showsScrollHighlight?: boolean;
  // длительность подсветки (сек)
  scrollHighlightDuration?: number;
}

export interface ChatViewabilityConfig {
  // минимальное время видимости (сек)
  minimumViewTime?: number;
  // % покрытия экрана
  viewAreaCoveragePercentThreshold?: number;
  // % видимости элемента
  itemVisiblePercentThreshold?: number;
  // ждать первого взаимодействия
  waitForInteraction?: boolean;
}

export interface ChatDateFormattingConfig {
  // формат даты группы
  dateSeparatorFormat?: string;
  // формат времени сообщения
  messageTimeFormat?: string;
  // локаль форматирования
  locale?: string;
}

export interface ChatConfiguration {
  // настройки layout
  layout?: ChatLayoutConfig;
  // цвета
  colors?: ChatColorsConfig;
  // шрифты
  fonts?: ChatFontsConfig;
  // поведение
  behavior?: ChatBehaviorConfig;
  // трекинг видимости
  viewability?: ChatViewabilityConfig;
  // форматирование дат
  dateFormatting?: ChatDateFormattingConfig;
}

export interface ChatViewProps {
  // id текущего пользователя
  userId: number;
  // конфигурация чата (можно передавать частично)
  configuration?: ChatConfiguration;
  // массив сообщений
  messages?: RawMessage[];

  // стартовый скролл к сообщению по id
  initialScrollId?: string;
  // стартовый скролл по индексу от низа (0 = самый низ)
  initialScrollIndex?: number;
  // смещение от низа (px)
  initialScrollOffset?: number;

  // блокировать направление скролла
  directionalLockEnabled?: boolean;
  // режим скрытия клавиатуры
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
  // дополнительный отступ при клавиатуре
  keyboardScrollOffset?: number;
  // системный скролл к верху
  scrollsToTop?: boolean;
  // индикатор скролла
  showsVerticalScrollIndicator?: boolean;
  // разрешить скролл
  scrollEnabled?: boolean;
  // дополнительные отступы
  insets?: ChatEdgeInsets;

  // сообщения попали в видимую область
  onVisibleMessages?: (messageIds: string[]) => void;
  // запрос подгрузки старых
  onLoadPreviousMessages?: () => void;
  // переслать
  onForwardMessage?: (messageId: string) => void;
  // избранное
  onFavoriteMessage?: (messageId: string) => void;
  // ответ
  onReplyToMessage?: (messageId: string) => void;
  // удаление
  onDelete?: (messageId: string) => void;

  // события скролла
  onScroll?: (event: ScrollEvent) => void;
  // начало drag
  onScrollBeginDrag?: () => void;
  // конец drag
  onScrollEndDrag?: () => void;
  // конец инерции
  onMomentumScrollEnd?: () => void;
  // конец анимации скролла
  onScrollAnimationEnd?: () => void;

  // стиль контейнера
  style?: StyleProp<ViewStyle>;
}

export interface ChatRef {
  // установить сообщения целиком
  setMessages: (messages: RawMessage[]) => void;
  // добавить сообщения
  appendMessages: (messages: RawMessage[]) => void;
  // добавить старые сообщения в начало
  prependMessages: (messages: RawMessage[]) => void;
  // удалить сообщение
  deleteMessage: (messageId: string) => void;
  // отметить прочитанными
  markMessagesAsRead: (messageIds: string[]) => void;
  // отметить доставленными
  markMessagesAsReceived: (messageIds: string[]) => void;
  // индикатор набора
  // скролл вниз
  scrollToBottom: (animated: boolean) => void;
  // скролл к сообщению
  scrollToMessage: (messageId: string, animated: boolean) => void;
  // скролл к индексу от низа
  scrollToIndex: (index: number, animated: boolean) => void;
  // скролл к офсету от низа
  scrollToOffset: (offset: number, animated: boolean) => void;
}
