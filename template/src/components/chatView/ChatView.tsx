// ChatView.tsx

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
  NativeChatFileItem as ChatFileItem,
  NativeChatFilePressEventData as ChatFilePressEventData,
  NativeChatImageItem as ChatImageItem,
  NativeChatInputAction,
  NativeChatInputTypingEventData as ChatInputTypingEventData,
  NativeChatMessage,
  NativeChatMessagePressEventData as ChatMessagePressEventData,
  NativeChatMessagesVisibleEventData as ChatMessagesVisibleEventData,
  NativeChatPoll as ChatPoll,
  NativeChatPollDetailPressEventData as ChatPollDetailPressEventData,
  NativeChatPollOption as ChatPollOption,
  NativeChatPollOptionPressEventData as ChatPollOptionPressEventData,
  NativeChatReachBottomEventData as ChatReachBottomEventData,
  NativeChatReachTopEventData as ChatReachTopEventData,
  NativeChatReactionTapEventData as ChatReactionTapEventData,
  NativeChatReplyMessagePressEventData as ChatReplyMessagePressEventData,
  NativeChatReplyRef as ChatReplyRef,
  NativeChatScrollEventData as ChatScrollEventData,
  NativeChatSendMessageEventData as ChatSendMessageEventData,
  NativeChatVideoItem as ChatVideoItem,
  NativeChatVideoPressEventData as ChatVideoPressEventData,
  NativeChatViewCommands,
  NativeChatViewProps,
  NativeChatVoiceRecordingCompleteEventData as ChatVoiceRecordingCompleteEventData,
} from "../../NativeChatViewSpec";

// ─── Public types ─────────────────────────────────────────────────────────────

type ChatMessageStatus = "sending" | "sent" | "delivered" | "read";
interface ChatMessage extends NativeChatMessage {
  status?: ChatMessageStatus;
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
}

export type {
  ChatAction,
  ChatActionPressEventData,
  ChatAttachmentPressEventData,
  ChatCancelInputActionEventData,
  ChatEditMessageEventData,
  ChatEmojiReactionSelectData,
  ChatFileItem,
  ChatFilePressEventData,
  ChatImageItem,
  ChatInputAction,
  ChatInputActionType,
  ChatInputTypingEventData,
  ChatMessage,
  ChatMessagePressEventData,
  ChatMessagesVisibleEventData,
  ChatPoll,
  ChatPollDetailPressEventData,
  ChatPollOption,
  ChatPollOptionPressEventData,
  ChatReachBottomEventData,
  ChatReachTopEventData,
  ChatReactionTapEventData,
  ChatReplyMessagePressEventData,
  ChatReplyRef,
  ChatScrollEventData,
  ChatScrollPosition,
  ChatSendMessageEventData,
  ChatTheme,
  ChatVideoItem,
  ChatVideoPressEventData,
  ChatViewCommands,
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
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ChatViewProps extends ViewProps {
  messages: NativeChatMessage[];

  /**
   * Колбэк для формирования контекстного меню.
   * Принимает сообщение, возвращает массив actions для его контекстного меню.
   * Вызывается при подготовке messages перед передачей в native.
   */
  getActionsForMessage?: (message: NativeChatMessage) => ChatAction[];

  /**
   * Список эмодзи для панели контекстного меню.
   * При долгом нажатии на сообщение отображается emoji-панель с этими эмодзи.
   * Пример: ["❤️", "👍", "😂", "😮", "😢", "🙏"]
   */
  emojiReactions?: string[];

  inputAction?: ChatInputAction | null;
  initialScrollId?: string;
  scrollToBottomThreshold?: number;
  /** Есть ли более старые сообщения для подгрузки сверху. */
  hasMore?: boolean;
  /** Есть ли более новые сообщения для подгрузки снизу (detached mode). */
  hasNewer?: boolean;

  topThreshold?: number;
  bottomThreshold?: number;
  isLoading?: boolean;
  isLoadingTop?: boolean;
  isLoadingBottom?: boolean;
  theme?: ChatTheme;
  style?: ViewStyle;
  collectionInsetTop?: number;
  collectionInsetBottom?: number;
  inputTypingThrottle?: number;
  showSenderName?: boolean;

  onScroll?: (event: ChatScrollEventData) => void;
  onReachTop?: (event: ChatReachTopEventData) => void;
  onReachBottom?: (event: ChatReachBottomEventData) => void;
  onMessagesVisible?: (event: ChatMessagesVisibleEventData) => void;
  onMessagePress?: (event: ChatMessagePressEventData) => void;
  onActionPress?: (event: ChatActionPressEventData) => void;
  onEmojiReactionSelect?: (event: ChatEmojiReactionSelectData) => void;
  onSendMessage?: (event: ChatSendMessageEventData) => void;
  onEditMessage?: (event: ChatEditMessageEventData) => void;
  onCancelInputAction?: (event: ChatCancelInputActionEventData) => void;
  onAttachmentPress?: (event: ChatAttachmentPressEventData) => void;
  onReplyMessagePress?: (event: ChatReplyMessagePressEventData) => void;
  onVideoPress?: (event: ChatVideoPressEventData) => void;
  onPollOptionPress?: (event: ChatPollOptionPressEventData) => void;
  onPollDetailPress?: (event: ChatPollDetailPressEventData) => void;
  onFilePress?: (event: ChatFilePressEventData) => void;
  onVoiceRecordingComplete?: (
    event: ChatVoiceRecordingCompleteEventData,
  ) => void;
  onInputTyping?: (event: ChatInputTypingEventData) => void;
  onReactionTap?: (event: ChatReactionTapEventData) => void;
}

// ─── Native component ─────────────────────────────────────────────────────────

const COMPONENT_NAME = "RNChatView";

const NativeChatView = (() => {
  try {
    const Spec = require("../../NativeChatViewSpec").default;

    return Spec as HostComponent<NativeChatViewProps>;
  } catch {
    return requireNativeComponent<NativeChatViewProps>(COMPONENT_NAME);
  }
})();

// ─── Command dispatcher ───────────────────────────────────────────────────────

function dispatchCommand(
  nativeRef: React.RefObject<React.ComponentRef<typeof NativeChatView> | null>,
  commandName: keyof ChatViewCommands,
  args: unknown[],
): void {
  try {
    const { Commands } = require("../../NativeChatViewSpec");

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
    initialScrollId,
    scrollToBottomThreshold = 150,
    hasMore = false,
    hasNewer = false,
    topThreshold = 200,
    bottomThreshold = 200,
    isLoading = false,
    isLoadingTop = false,
    isLoadingBottom = false,
    theme = "light",
    style,
    collectionInsetTop,
    collectionInsetBottom,
    onScroll,
    onReachTop,
    onReachBottom,
    onMessagesVisible,
    onMessagePress,
    onActionPress,
    onEmojiReactionSelect,
    onSendMessage,
    onEditMessage,
    onCancelInputAction,
    onAttachmentPress,
    onReplyMessagePress,
    onVideoPress,
    onPollOptionPress,
    onPollDetailPress,
    onFilePress,
    onVoiceRecordingComplete,
    onInputTyping,
    onReactionTap,
    inputTypingThrottle,
    showSenderName,
  } = props;

  const nativeRef = useRef<React.ComponentRef<typeof NativeChatView>>(null);

  // ─── Per-message actions via callback ───────────────────────────────────

  const nativeMessages = useMemo(() => {
    if (!getActionsForMessage) return messages;

    return messages.map(msg => ({
      ...msg,
      actions: getActionsForMessage(msg),
    }));
  }, [messages, getActionsForMessage]);

  // ─── Imperative API ──────────────────────────────────────────────────────

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
  const handleMessagesVisible = useCallback(
    (e: NativeSyntheticEvent<ChatMessagesVisibleEventData>) =>
      onMessagesVisible?.(e.nativeEvent),
    [onMessagesVisible],
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
  const handleVideoPress = useCallback(
    (e: NativeSyntheticEvent<ChatVideoPressEventData>) =>
      onVideoPress?.(e.nativeEvent),
    [onVideoPress],
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
  const handleFilePress = useCallback(
    (e: NativeSyntheticEvent<ChatFilePressEventData>) =>
      onFilePress?.(e.nativeEvent),
    [onFilePress],
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

  const nativeInputAction: NativeChatInputAction = inputAction ?? {
    type: "none",
  };

  return (
    <NativeChatView
      ref={nativeRef}
      style={[styles.fill, style]}
      messages={nativeMessages}
      emojiReactions={emojiReactions}
      inputAction={nativeInputAction}
      initialScrollId={initialScrollId}
      scrollToBottomThreshold={scrollToBottomThreshold}
      hasMore={hasMore}
      hasNewer={hasNewer}
      topThreshold={topThreshold}
      bottomThreshold={bottomThreshold}
      isLoading={isLoading}
      isLoadingTop={isLoadingTop}
      isLoadingBottom={isLoadingBottom}
      theme={theme}
      collectionInsetTop={collectionInsetTop}
      collectionInsetBottom={collectionInsetBottom}
      onScroll={handleScroll}
      onReachTop={handleReachTop}
      onReachBottom={handleReachBottom}
      onMessagesVisible={handleMessagesVisible}
      onMessagePress={handleMessagePress}
      onActionPress={handleActionPress}
      onEmojiReactionSelect={handleEmojiReactionSelect}
      onSendMessage={handleSendMessage}
      onEditMessage={handleEditMessage}
      onCancelInputAction={handleCancelInputAction}
      onAttachmentPress={handleAttachmentPress}
      onReplyMessagePress={handleReplyMessagePress}
      onVideoPress={handleVideoPress}
      onPollOptionPress={handlePollOptionPress}
      onPollDetailPress={handlePollDetailPress}
      onFilePress={handleFilePress}
      onVoiceRecordingComplete={handleVoiceRecordingComplete}
      onInputTyping={handleInputTyping}
      onReactionTap={handleReactionTap}
      inputTypingThrottle={inputTypingThrottle}
      showSenderName={showSenderName}
    />
  );
});

ChatView.displayName = "ChatView";

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
