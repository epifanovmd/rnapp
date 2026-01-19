export interface RawMessage {
  id: string;
  date: number; // timestamp
  userId: number;
  status: "sent" | "received" | "read";
  data: {
    text?: string;
    url?: string;
    image?: {
      uri: string;
      isUrL: boolean;
    };
  };
}

export interface ScrollEvent {
  contentOffset: { x: number; y: number };
  contentSize: { width: number; height: number };
}

export interface ChatViewProps {
  userId: number;

  initialScrollId?: string;
  initialScrollIndex?: number;
  initialScrollOffset?: number;
  initialScrollDate?: number;

  // Конфигурация скролла
  directionalLockEnabled?: boolean;
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
  scrollsToTop?: boolean;
  showsVerticalScrollIndicator?: boolean;
  scrollEnabled?: boolean;

  // События данных
  onVisibleMessages?: (messageIds: string[]) => void;
  onLoadPreviousMessages?: () => void;
  onDelete?: (messageId: string) => void;

  // События скролла
  onScroll?: (event: ScrollEvent) => void;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
  onMomentumScrollEnd?: () => void;
  onScrollAnimationEnd?: () => void;

  style?: any;
}

export interface ChatRef {
  appendMessages: (messages: RawMessage[]) => void;
  deleteMessage: (messageId: string) => void;
  markAsRead: (lastReadId: string) => void; // на нативной стороне это маркает пачку id или по логике чата
  setTyping: (isTyping: boolean) => void;
  // Добавим методы управления скроллом, если они реализованы в нативном модуле
  scrollToBottom: (animated: boolean) => void;
  scrollToMessage: (messageId: string, animated: boolean) => void;
  scrollToIndex: (index: number, animated: boolean) => void;
  scrollToOffset: (offset: number, animated: boolean) => void;
  scrollToDate: (timestamp: number, animated: boolean) => void;
}
