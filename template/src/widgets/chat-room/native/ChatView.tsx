// ChatView.tsx
// Platform-aware wrapper: iOS uses native RNChatView, Android uses ChatViewRN (React Native).

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  findNodeHandle,
  type HostComponent,
  type NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  StyleSheet,
  UIManager,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import {
  NativeChatAction as ChatAction,
  NativeChatActionPressEventData as ChatActionPressEventData,
  NativeChatAttachmentPressEventData as ChatAttachmentPressEventData,
  NativeChatCancelInputActionEventData as ChatCancelInputActionEventData,
  NativeChatEditMessageEventData as ChatEditMessageEventData,
  NativeChatEmojiReactionSelectData as ChatEmojiReactionSelectData,
  NativeChatFabPressEventData as ChatFabPressEventData,
  NativeChatFeatures,
  NativeChatFileItem as ChatFileItem,
  NativeChatImageItem as ChatImageItem,
  NativeChatInputAction,
  NativeChatInputTypingEventData as ChatInputTypingEventData,
  NativeChatLayoutConfig as ChatLayoutConfig,
  NativeChatLinkTapEventData as ChatLinkTapEventData,
  NativeChatMessage,
  NativeChatMessagePressEventData as ChatMessagePressEventData,
  NativeChatPhoneNumberTapEventData as ChatPhoneNumberTapEventData,
  NativeChatPoll as ChatPoll,
  NativeChatPollDetailPressEventData as ChatPollDetailPressEventData,
  NativeChatPollOption as ChatPollOption,
  NativeChatPollOptionPressEventData as ChatPollOptionPressEventData,
  NativeChatReachBottomEventData as ChatReachBottomEventData,
  NativeChatReachTopEventData as ChatReachTopEventData,
  NativeChatReactionTapEventData as ChatReactionTapEventData,
  NativeChatReplyMessagePressEventData as ChatReplyMessagePressEventData,
  NativeChatReplyRef as ChatReplyRef,
  NativeChatScrollAnchorChangedEventData as ChatScrollAnchorChangedEventData,
  NativeChatScrollEventData as ChatScrollEventData,
  NativeChatSendMessageEventData as ChatSendMessageEventData,
  NativeChatThreadInfo as ChatThreadInfo,
  NativeChatThreadTapEventData as ChatThreadTapEventData,
  NativeChatUnreadMessagesAppearEventData as ChatUnreadMessagesAppearEventData,
  NativeChatVideoItem as ChatVideoItem,
  NativeChatViewCommands,
  NativeChatViewProps,
  NativeChatVisibleMessagesChangeEventData as ChatVisibleMessagesChangeEventData,
  NativeChatVoiceRecordingCompleteEventData as ChatVoiceRecordingCompleteEventData,
} from "./NativeChatViewSpec";

// ─── Public types ─────────────────────────────────────────────────────────────

type ChatMessageStatus = "sending" | "sent" | "delivered" | "read";
type ChatMessageOwnership = "mine" | "theirs" | "system" | "pinned";
type ChatSenderNameMode = "never" | "incomingOnly" | "always";

interface ChatFeatures extends Omit<NativeChatFeatures, "senderNameMode"> {
  senderNameMode?: ChatSenderNameMode;
}

interface ChatMessage extends NativeChatMessage {
  status?: ChatMessageStatus;
  ownership?: ChatMessageOwnership;
}
type ChatScrollPosition = "top" | "center" | "bottom";
type ChatTheme = "light" | "dark";

type ChatInputActionType = "reply" | "edit" | "none";
type ChatInputAction = {
  type: ChatInputActionType;
  messageId?: string;
};

interface ChatViewCommands extends NativeChatViewCommands {
  scrollToMessage(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
    messageId: string,
    position: ChatScrollPosition,
    animated: boolean,
    highlight: boolean,
  ): void;
  clearUnread(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
  ): void;
}

export type {
  ChatAction,
  ChatActionPressEventData,
  ChatAttachmentPressEventData,
  ChatCancelInputActionEventData,
  ChatEditMessageEventData,
  ChatEmojiReactionSelectData,
  ChatFabPressEventData,
  ChatFeatures,
  ChatFileItem,
  ChatImageItem,
  ChatInputAction,
  ChatInputActionType,
  ChatInputTypingEventData,
  ChatLayoutConfig,
  ChatLinkTapEventData,
  ChatMessage,
  ChatMessageOwnership,
  ChatMessagePressEventData,
  ChatMessageStatus,
  ChatPhoneNumberTapEventData,
  ChatPoll,
  ChatPollDetailPressEventData,
  ChatPollOption,
  ChatPollOptionPressEventData,
  ChatReachBottomEventData,
  ChatReachTopEventData,
  ChatReactionTapEventData,
  ChatReplyMessagePressEventData,
  ChatReplyRef,
  ChatScrollAnchorChangedEventData,
  ChatScrollEventData,
  ChatScrollPosition,
  ChatSenderNameMode,
  ChatSendMessageEventData,
  ChatTheme,
  ChatThreadInfo,
  ChatThreadTapEventData,
  ChatUnreadMessagesAppearEventData,
  ChatVideoItem,
  ChatViewCommands,
  ChatVisibleMessagesChangeEventData,
  ChatVoiceRecordingCompleteEventData,
};

// ─── Imperative handle ────────────────────────────────────────────────────────

export interface ChatView {
  scrollToBottom(): void;
  scrollToMessage(
    messageId: string,
    options?: {
      position?: ChatScrollPosition;
      animated?: boolean;
      highlight?: boolean;
    },
  ): void;
  clearUnread(): void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ChatViewProps extends ViewProps {
  messages: ChatMessage[];

  /**
   * Колбэк для формирования контекстного меню.
   * Принимает сообщение, возвращает массив actions для его контекстного меню.
   * Вызывается при подготовке messages перед передачей в native.
   */
  getActionsForMessage?: (message: ChatMessage) => ChatAction[];

  /**
   * Список эмодзи для панели контекстного меню.
   * При долгом нажатии на сообщение отображается emoji-панель с этими эмодзи.
   * Пример: ["❤️", "👍", "😂", "😮", "😢", "🙏"]
   */
  emojiReactions?: string[];

  inputAction?: ChatInputAction | null;
  /** Pixel-accurate scroll anchor for initial scroll restore. */
  initialScrollAnchor?: {
    messageId: string;
    offset: number;
    wasAtBottom: boolean;
  };
  scrollToBottomThreshold?: number;
  /** Есть ли более старые сообщения для подгрузки сверху. */
  hasMore?: boolean;
  /** Есть ли более новые сообщения для подгрузки снизу (detached mode). */
  hasNewer?: boolean;

  topThreshold?: number;
  bottomThreshold?: number;
  isLoading?: boolean;
  /** Текст пустого состояния (когда нет сообщений и не идёт загрузка). */
  emptyStateText?: string;
  isLoadingTop?: boolean;
  isLoadingBottom?: boolean;
  /** Показывать спиннер-кольцо на FAB-кнопке (принудительно отображает FAB). */
  isLoadingFab?: boolean;
  theme?: ChatTheme;
  style?: ViewStyle;
  collectionInsetTop?: number;
  collectionInsetBottom?: number;
  inputTypingThrottle?: number;
  showSenderName?: boolean;
  showFloatingDate?: boolean;

  /** All feature flags as a single object. Overrides individual feature props when set. */
  features?: ChatFeatures;
  /** Layout constants (numeric values, fonts excluded). */
  layout?: ChatLayoutConfig;

  /** Интервал троттлинга снимка видимых сообщений (секунды, default 0.3) */
  visibleMessagesThrottleInterval?: number;
  /** Интервал дебаунса непрочитанных сообщений (секунды, default 0.3) */
  unreadMessagesDebounceInterval?: number;
  /** Минимальная доля видимости ячейки для снимка видимых (0..1, default 0.8) */
  visibilityThreshold?: number;
  /** Минимальная доля видимости ячейки для mark-as-read (0..1, default 0.5) */
  unreadVisibilityThreshold?: number;

  onScroll?: (event: ChatScrollEventData) => void;
  onReachTop?: (event: ChatReachTopEventData) => void;
  onReachBottom?: (event: ChatReachBottomEventData) => void;
  /** Снимок видимых на экране сообщений (throttle) */
  onVisibleMessagesChange?: (event: ChatVisibleMessagesChangeEventData) => void;
  /** Непрочитанные сообщения появились на экране (debounce) */
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
  /** Нажатие на ссылку в тексте сообщения */
  onLinkTap?: (event: ChatLinkTapEventData) => void;
  /** Нажатие на номер телефона в тексте сообщения */
  onPhoneNumberTap?: (event: ChatPhoneNumberTapEventData) => void;
  onFabPress?: (event: ChatFabPressEventData) => void;
  /** Throttled scroll anchor update (~300ms). Use for scroll position persistence. */
  onScrollAnchorChanged?: (event: ChatScrollAnchorChangedEventData) => void;
  unreadCount?: number;
}

// ─── Native component ─────────────────────────────────────────────────────────

const COMPONENT_NAME = "RNChatView";

const NativeChatView = (() => {
  if (Platform.OS === "android") {
    return null;
  }
  try {
    const Spec = require("./NativeChatViewSpec").default;

    return Spec as HostComponent<NativeChatViewProps>;
  } catch {
    return requireNativeComponent<NativeChatViewProps>(COMPONENT_NAME);
  }
})();

// ─── Command dispatcher ───────────────────────────────────────────────────────

function dispatchCommand(
  nativeRef: React.RefObject<React.ComponentRef<
    HostComponent<NativeChatViewProps>
  > | null>,
  commandName: keyof ChatViewCommands,
  args: unknown[],
): void {
  try {
    const { Commands } = require("./NativeChatViewSpec");

    if (Commands?.[commandName] && nativeRef.current) {
      Commands[commandName](nativeRef.current, ...args);

      return;
    }
  } catch {
    /* fall through */
  }
  const node = findNodeHandle(nativeRef.current);

  if (node) {
    UIManager.dispatchViewManagerCommand(
      node,
      UIManager.getViewManagerConfig(COMPONENT_NAME).Commands[commandName],
      args,
    );
  }
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

export const ChatView = forwardRef<ChatView, ChatViewProps>((props, ref) => {
  const {
    messages,
    getActionsForMessage,
    emojiReactions = [],
    inputAction,
    initialScrollAnchor,
    scrollToBottomThreshold = 150,
    hasMore = false,
    hasNewer = false,
    topThreshold = 200,
    bottomThreshold = 200,
    isLoading = false,
    emptyStateText,
    isLoadingTop = false,
    isLoadingBottom = false,
    isLoadingFab = false,
    theme = "light",
    style,
    collectionInsetTop,
    collectionInsetBottom,
    visibleMessagesThrottleInterval,
    unreadMessagesDebounceInterval,
    visibilityThreshold,
    unreadVisibilityThreshold,
    onScroll,
    onReachTop,
    onReachBottom,
    onVisibleMessagesChange,
    onUnreadMessagesAppear,
    onMessagePress,
    onActionPress,
    onEmojiReactionSelect,
    onSendMessage,
    onEditMessage,
    onCancelInputAction,
    onAttachmentPress,
    onReplyMessagePress,
    onPollOptionPress,
    onPollDetailPress,
    onVoiceRecordingComplete,
    onInputTyping,
    onReactionTap,
    onThreadTap,
    onLinkTap,
    onPhoneNumberTap,
    onFabPress,
    onScrollAnchorChanged,
    inputTypingThrottle,
    showSenderName,
    showFloatingDate = true,
    features,
    layout: layoutConfig,
    unreadCount,
  } = props;

  const nativeRef =
    useRef<React.ComponentRef<HostComponent<NativeChatViewProps>>>(null);

  // ─── Per-message actions via callback ───────────────────────────────────

  const nativeMessages = useMemo(() => {
    if (!getActionsForMessage) return messages;

    return messages.map(msg => ({
      ...msg,
      actions: getActionsForMessage(msg),
    }));
  }, [messages, getActionsForMessage]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom() {
        dispatchCommand(nativeRef, "scrollToBottom", []);
      },
      scrollToMessage(messageId, options = {}) {
        const {
          position = "center",
          animated = true,
          highlight = true,
        } = options;

        dispatchCommand(nativeRef, "scrollToMessage", [
          messageId,
          position,
          animated,
          highlight,
        ]);
      },
      clearUnread() {
        dispatchCommand(nativeRef, "clearUnread", []);
      },
    }),
    [],
  );

  // ─── Event bridges ───────────────────────────────────────────────────────

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<ChatScrollEventData>) => onScroll?.(e.nativeEvent),
    [onScroll],
  );
  const handleReachTop = useCallback(
    (e: NativeSyntheticEvent<ChatReachTopEventData>) =>
      onReachTop?.(e.nativeEvent),
    [onReachTop],
  );
  const handleReachBottom = useCallback(
    (e: NativeSyntheticEvent<ChatReachBottomEventData>) =>
      onReachBottom?.(e.nativeEvent),
    [onReachBottom],
  );
  const handleVisibleMessagesChange = useCallback(
    (e: NativeSyntheticEvent<ChatVisibleMessagesChangeEventData>) =>
      onVisibleMessagesChange?.(e.nativeEvent),
    [onVisibleMessagesChange],
  );
  const handleUnreadMessagesAppear = useCallback(
    (e: NativeSyntheticEvent<ChatUnreadMessagesAppearEventData>) =>
      onUnreadMessagesAppear?.(e.nativeEvent),
    [onUnreadMessagesAppear],
  );
  const handleMessagePress = useCallback(
    (e: NativeSyntheticEvent<ChatMessagePressEventData>) =>
      onMessagePress?.(e.nativeEvent),
    [onMessagePress],
  );
  const handleActionPress = useCallback(
    (e: NativeSyntheticEvent<ChatActionPressEventData>) =>
      onActionPress?.(e.nativeEvent),
    [onActionPress],
  );
  const handleEmojiReactionSelect = useCallback(
    (e: NativeSyntheticEvent<ChatEmojiReactionSelectData>) =>
      onEmojiReactionSelect?.(e.nativeEvent),
    [onEmojiReactionSelect],
  );
  const handleSendMessage = useCallback(
    (e: NativeSyntheticEvent<ChatSendMessageEventData>) =>
      onSendMessage?.(e.nativeEvent),
    [onSendMessage],
  );
  const handleEditMessage = useCallback(
    (e: NativeSyntheticEvent<ChatEditMessageEventData>) =>
      onEditMessage?.(e.nativeEvent),
    [onEditMessage],
  );
  const handleCancelInputAction = useCallback(
    (e: NativeSyntheticEvent<ChatCancelInputActionEventData>) =>
      onCancelInputAction?.(e.nativeEvent),
    [onCancelInputAction],
  );
  const handleAttachmentPress = useCallback(
    (e: NativeSyntheticEvent<ChatAttachmentPressEventData>) =>
      onAttachmentPress?.(e.nativeEvent),
    [onAttachmentPress],
  );
  const handleReplyMessagePress = useCallback(
    (e: NativeSyntheticEvent<ChatReplyMessagePressEventData>) =>
      onReplyMessagePress?.(e.nativeEvent),
    [onReplyMessagePress],
  );
  const handlePollOptionPress = useCallback(
    (e: NativeSyntheticEvent<ChatPollOptionPressEventData>) =>
      onPollOptionPress?.(e.nativeEvent),
    [onPollOptionPress],
  );
  const handlePollDetailPress = useCallback(
    (e: NativeSyntheticEvent<ChatPollDetailPressEventData>) =>
      onPollDetailPress?.(e.nativeEvent),
    [onPollDetailPress],
  );
  const handleVoiceRecordingComplete = useCallback(
    (e: NativeSyntheticEvent<ChatVoiceRecordingCompleteEventData>) =>
      onVoiceRecordingComplete?.(e.nativeEvent),
    [onVoiceRecordingComplete],
  );
  const handleInputTyping = useCallback(
    (e: NativeSyntheticEvent<ChatInputTypingEventData>) =>
      onInputTyping?.(e.nativeEvent),
    [onInputTyping],
  );
  const handleReactionTap = useCallback(
    (e: NativeSyntheticEvent<ChatReactionTapEventData>) =>
      onReactionTap?.(e.nativeEvent),
    [onReactionTap],
  );
  const handleLinkTap = useCallback(
    (e: NativeSyntheticEvent<ChatLinkTapEventData>) =>
      onLinkTap?.(e.nativeEvent),
    [onLinkTap],
  );
  const handlePhoneNumberTap = useCallback(
    (e: NativeSyntheticEvent<ChatPhoneNumberTapEventData>) =>
      onPhoneNumberTap?.(e.nativeEvent),
    [onPhoneNumberTap],
  );
  const handleThreadTap = useCallback(
    (e: NativeSyntheticEvent<ChatThreadTapEventData>) =>
      onThreadTap?.(e.nativeEvent),
    [onThreadTap],
  );
  const handleFabPress = useCallback(
    (e: NativeSyntheticEvent<ChatFabPressEventData>) =>
      onFabPress?.(e.nativeEvent),
    [onFabPress],
  );
  const handleScrollAnchorChanged = useCallback(
    (e: NativeSyntheticEvent<ChatScrollAnchorChangedEventData>) =>
      onScrollAnchorChanged?.(e.nativeEvent),
    [onScrollAnchorChanged],
  );

  const nativeInputAction: NativeChatInputAction = inputAction ?? {
    type: "none",
  };

  if (!NativeChatView) return null;

  return (
    <NativeChatView
      ref={nativeRef}
      style={[styles.fill, style]}
      messages={nativeMessages}
      emojiReactions={emojiReactions}
      inputAction={nativeInputAction}
      initialScrollAnchor={initialScrollAnchor}
      scrollToBottomThreshold={scrollToBottomThreshold}
      hasMore={hasMore}
      hasNewer={hasNewer}
      topThreshold={topThreshold}
      bottomThreshold={bottomThreshold}
      isLoading={isLoading}
      emptyStateText={emptyStateText}
      isLoadingTop={isLoadingTop}
      isLoadingBottom={isLoadingBottom}
      isLoadingFab={isLoadingFab}
      theme={theme}
      collectionInsetTop={collectionInsetTop}
      collectionInsetBottom={collectionInsetBottom}
      onScroll={handleScroll}
      onReachTop={handleReachTop}
      onReachBottom={handleReachBottom}
      onVisibleMessagesChange={handleVisibleMessagesChange}
      onUnreadMessagesAppear={handleUnreadMessagesAppear}
      visibleMessagesThrottleInterval={visibleMessagesThrottleInterval}
      unreadMessagesDebounceInterval={unreadMessagesDebounceInterval}
      visibilityThreshold={visibilityThreshold}
      unreadVisibilityThreshold={unreadVisibilityThreshold}
      onMessagePress={handleMessagePress}
      onActionPress={handleActionPress}
      onEmojiReactionSelect={handleEmojiReactionSelect}
      onSendMessage={handleSendMessage}
      onEditMessage={handleEditMessage}
      onCancelInputAction={handleCancelInputAction}
      onAttachmentPress={handleAttachmentPress}
      onReplyMessagePress={handleReplyMessagePress}
      onPollOptionPress={handlePollOptionPress}
      onPollDetailPress={handlePollDetailPress}
      onVoiceRecordingComplete={handleVoiceRecordingComplete}
      onInputTyping={handleInputTyping}
      onReactionTap={handleReactionTap}
      onThreadTap={handleThreadTap}
      onLinkTap={handleLinkTap}
      onPhoneNumberTap={handlePhoneNumberTap}
      onFabPress={handleFabPress}
      onScrollAnchorChanged={handleScrollAnchorChanged}
      inputTypingThrottle={inputTypingThrottle}
      showSenderName={showSenderName}
      showFloatingDate={showFloatingDate}
      features={features}
      layout={layoutConfig}
      unreadCount={unreadCount}
    />
  );
});

ChatView.displayName = "ChatView";

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
