// ChatView.tsx
// React Native TypeScript wrapper for RNChatView native component
// Supports both Old and New Architecture

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import {
  findNodeHandle,
  type NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  StyleSheet,
  UIManager,
  View,
  type ViewStyle,
} from "react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImageItem {
  url: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface ChatMessage {
  id: string;
  text?: string;
  images?: ImageItem[];
  /** Unix timestamp in milliseconds */
  timestamp: number;
  senderName?: string;
  avatarUrl?: string;
  isMine?: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
  replyTo?: { id: string; text?: string; senderName?: string };
}

export interface ChatAction {
  id: string;
  title: string;
  /** SF Symbol name, e.g. "trash", "heart.fill" */
  systemImage?: string;
  isDestructive?: boolean;
}

// ─── Event payload types ──────────────────────────────────────────────────────

export interface ScrollEvent {
  x: number;
  y: number;
}
export interface ReachTopEvent {
  distanceFromTop: number;
}
export interface MessagesVisibleEvent {
  messageIds: string[];
}
export interface MessagePressEvent {
  messageId: string;
  message: ChatMessage;
}
export interface ActionPressEvent {
  actionId: string;
  messageId: string;
  message: ChatMessage;
}
export interface SendMessageEvent {
  text: string;
  replyToId?: string;
}
export interface AttachmentPressEvent {}
export interface ReplyMessagePressEvent {
  messageId: string;
}

// ─── Scroll position ──────────────────────────────────────────────────────────

export type ChatScrollPosition = "top" | "center" | "bottom";

// ─── Imperative handle ────────────────────────────────────────────────────────

export interface ChatViewHandle {
  /**
   * Programmatically scroll to the last message.
   */
  scrollToBottom(): void;

  /**
   * Scroll to a specific message by id.
   * @param messageId   The target message `id`.
   * @param options.position   "top" | "center" | "bottom"  (default: "center")
   * @param options.animated   Whether to animate.           (default: true)
   * @param options.highlight  Whether to flash the cell.    (default: true)
   */
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

export interface ChatViewProps {
  messages: ChatMessage[];
  actions?: ChatAction[];
  replyMessage?: ChatMessage | null;

  /**
   * If provided the chat will initially position itself at this message
   * (with a highlight flash) instead of scrolling to the bottom.
   * Consumed once natively; changing it afterwards has no effect.
   */
  initialScrollToMessageId?: string;

  /**
   * Distance from the bottom (pts) at which the scroll-to-bottom FAB appears.
   * @default 150
   */
  scrollToBottomThreshold?: number;

  /**
   * Distance from top (pts) that triggers `onReachTop`.
   * @default 200
   */
  topThreshold?: number;

  isLoading?: boolean;

  style?: ViewStyle;

  onScroll?: (event: ScrollEvent) => void;
  onReachTop?: (event: ReachTopEvent) => void;
  onMessagesVisible?: (event: MessagesVisibleEvent) => void;
  onMessagePress?: (event: MessagePressEvent) => void;
  onActionPress?: (event: ActionPressEvent) => void;
  onSendMessage?: (event: SendMessageEvent) => void;
  onAttachmentPress?: (event: AttachmentPressEvent) => void;
  onReplyMessagePress?: (event: ReplyMessagePressEvent) => void;
}

// ─── Native component (lazy, architecture-agnostic) ───────────────────────────

const COMPONENT_NAME = "RNChatView";

const NativeChatView = (() => {
  try {
    // New Architecture: Codegen-generated spec
    return require("./NativeChatViewSpec").default;
  } catch {
    // Old Architecture fallback
    return requireNativeComponent(COMPONENT_NAME);
  }
})();

// ─── ChatView ─────────────────────────────────────────────────────────────────

const ChatView = forwardRef<ChatViewHandle, ChatViewProps>((props, ref) => {
  const {
    messages,
    actions = [],
    replyMessage,
    initialScrollToMessageId,
    scrollToBottomThreshold = 150,
    topThreshold = 200,
    isLoading = false,
    style,
    onScroll,
    onReachTop,
    onMessagesVisible,
    onMessagePress,
    onActionPress,
    onSendMessage,
    onAttachmentPress,
    onReplyMessagePress,
  } = props;

  const nativeRef = useRef<React.ElementRef<typeof NativeChatView>>(null);

  // ─── Imperative API ──────────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    scrollToBottom() {
      if (Platform.OS !== "ios") return;
      try {
        const { Commands } = require("./NativeChatViewSpec");

        if (Commands && nativeRef.current) {
          Commands.scrollToBottom(nativeRef.current);

          return;
        }
      } catch {
        /* fall through */
      }
      const node = findNodeHandle(nativeRef.current);

      if (node) {
        UIManager.dispatchViewManagerCommand(
          node,
          UIManager.getViewManagerConfig(COMPONENT_NAME).Commands
            .scrollToBottom,
          [],
        );
      }
    },

    scrollToMessage(messageId, options = {}) {
      if (Platform.OS !== "ios") return;
      const {
        position = "center",
        animated = true,
        highlight = true,
      } = options;

      try {
        const { Commands } = require("./NativeChatViewSpec");

        if (Commands && nativeRef.current) {
          Commands.scrollToMessage(
            nativeRef.current,
            messageId,
            position,
            animated,
            highlight,
          );

          return;
        }
      } catch {
        /* fall through */
      }
      const node = findNodeHandle(nativeRef.current);

      if (node) {
        UIManager.dispatchViewManagerCommand(
          node,
          UIManager.getViewManagerConfig(COMPONENT_NAME).Commands
            .scrollToMessage,
          [messageId, position, animated, highlight],
        );
      }
    },
  }));

  // ─── Event bridges ───────────────────────────────────────────────────────────

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<ScrollEvent>) => onScroll?.(e.nativeEvent),
    [onScroll],
  );
  const handleReachTop = useCallback(
    (e: NativeSyntheticEvent<ReachTopEvent>) => onReachTop?.(e.nativeEvent),
    [onReachTop],
  );
  const handleMessagesVisible = useCallback(
    (e: NativeSyntheticEvent<MessagesVisibleEvent>) =>
      onMessagesVisible?.(e.nativeEvent),
    [onMessagesVisible],
  );
  const handleMessagePress = useCallback(
    (e: NativeSyntheticEvent<MessagePressEvent>) =>
      onMessagePress?.(e.nativeEvent),
    [onMessagePress],
  );
  const handleActionPress = useCallback(
    (e: NativeSyntheticEvent<ActionPressEvent>) =>
      onActionPress?.(e.nativeEvent),
    [onActionPress],
  );
  const handleSendMessage = useCallback(
    (e: NativeSyntheticEvent<SendMessageEvent>) =>
      onSendMessage?.(e.nativeEvent),
    [onSendMessage],
  );
  const handleAttachmentPress = useCallback(
    (e: NativeSyntheticEvent<AttachmentPressEvent>) =>
      onAttachmentPress?.(e.nativeEvent),
    [onAttachmentPress],
  );
  const handleReplyMessagePress = useCallback(
    (e: NativeSyntheticEvent<ReplyMessagePressEvent>) =>
      onReplyMessagePress?.(e.nativeEvent),
    [onReplyMessagePress],
  );

  // ─── Non-iOS fallback ────────────────────────────────────────────────────────

  if (Platform.OS !== "ios") {
    return <View style={[styles.unsupported, style]} />;
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <NativeChatView
      ref={nativeRef}
      style={[styles.fill, style]}
      messages={messages}
      actions={actions}
      replyMessage={replyMessage ?? null}
      initialScrollToMessageId={initialScrollToMessageId}
      scrollToBottomThreshold={scrollToBottomThreshold}
      topThreshold={topThreshold}
      isLoading={isLoading}
      onScroll={handleScroll}
      onReachTop={handleReachTop}
      onMessagesVisible={handleMessagesVisible}
      onMessagePress={handleMessagePress}
      onActionPress={handleActionPress}
      onSendMessage={handleSendMessage}
      onAttachmentPress={handleAttachmentPress}
      onReplyMessagePress={handleReplyMessagePress}
    />
  );
});

ChatView.displayName = "ChatView";

export default ChatView;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  unsupported: { flex: 1, backgroundColor: "#f0f0f0" },
});
