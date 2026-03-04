// ChatView.tsx
// Public-facing React Native wrapper for the RNChatView iOS native component.
// Types are re-exported from the codegen spec so there is a single source of truth.
// Supports both Old Architecture (requireNativeComponent) and New Architecture (Fabric).

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
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
  View,
  ViewProps,
  type ViewStyle,
} from "react-native";

import {
  NativeChatAction as ChatAction,
  NativeChatActionPressEventData as ChatActionPressEventData,
  NativeChatAttachmentPressEventData as ChatAttachmentPressEventData,
  NativeChatImageItem as ChatImageItem,
  NativeChatMessage,
  NativeChatMessagePressEventData as ChatMessagePressEventData,
  NativeChatMessagesVisibleEventData as ChatMessagesVisibleEventData,
  NativeChatReachTopEventData as ChatReachTopEventData,
  NativeChatReplyMessagePressEventData as ChatReplyMessagePressEventData,
  NativeChatReplyRef as ChatReplyRef,
  NativeChatScrollEventData as ChatScrollEventData,
  NativeChatSendMessageEventData as ChatSendMessageEventData,
  NativeChatViewCommands,
  NativeChatViewProps,
} from "../../NativeChatViewSpec";

// ─── Re-export native types as public API ─────────────────────────────────────
export type {
  ChatAction,
  ChatActionPressEventData,
  ChatAttachmentPressEventData,
  ChatImageItem,
  ChatMessage,
  ChatMessagePressEventData,
  ChatMessagesVisibleEventData,
  ChatReachTopEventData,
  ChatReplyMessagePressEventData,
  ChatReplyRef,
  ChatScrollEventData,
  ChatScrollPosition,
  ChatSendMessageEventData,
  ChatViewCommands,
};

type ChatMessageStatus = "sending" | "sent" | "delivered" | "read";

interface ChatMessage extends NativeChatMessage {
  status?: ChatMessageStatus;
}

type ChatScrollPosition = "top" | "center" | "bottom";

interface ChatViewCommands extends NativeChatViewCommands {
  scrollToMessage(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
    messageId: string,
    position: ChatScrollPosition,
    animated: boolean,
    highlight: boolean,
  ): void;
}

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
  actions?: ChatAction[];
  replyMessage?: NativeChatMessage | null;
  initialScrollId?: string;
  scrollToBottomThreshold?: number;
  topThreshold?: number;
  isLoading?: boolean;
  style?: ViewStyle;

  onScroll?: (event: ChatScrollEventData) => void;
  onReachTop?: (event: ChatReachTopEventData) => void;
  onMessagesVisible?: (event: ChatMessagesVisibleEventData) => void;
  onMessagePress?: (event: ChatMessagePressEventData) => void;
  onActionPress?: (event: ChatActionPressEventData) => void;
  onSendMessage?: (event: ChatSendMessageEventData) => void;
  onAttachmentPress?: (event: ChatAttachmentPressEventData) => void;
  onReplyMessagePress?: (event: ChatReplyMessagePressEventData) => void;
}

// ─── Native component (architecture-agnostic lazy init) ───────────────────────

const COMPONENT_NAME = "RNChatView";

// Try New Architecture first (codegen spec), fall back to Old Architecture.
const NativeChatView = (() => {
  try {
    // Пытаемся получить компонент из codegen (New Architecture)
    const Spec = require("../../NativeChatViewSpec").default;

    return Spec as HostComponent<NativeChatViewProps>;
  } catch {
    return requireNativeComponent<NativeChatViewProps>(COMPONENT_NAME);
  }
})();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Dispatch a command via the New Architecture Commands API or Old Architecture UIManager. */
function dispatchCommand(
  nativeRef: React.RefObject<React.ComponentRef<typeof NativeChatView> | null>,
  commandName: keyof ChatViewCommands,
  args: unknown[],
): void {
  if (Platform.OS !== "ios") return;

  try {
    const { Commands } = require("../../NativeChatViewSpec");

    if (Commands?.[commandName] && nativeRef.current) {
      Commands[commandName](nativeRef.current, ...args);

      return;
    }
  } catch {
    //
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
    actions = [],
    replyMessage,
    initialScrollId,
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

  const nativeRef = useRef<React.ComponentRef<typeof NativeChatView>>(null);

  // ─── Imperative API ──────────────────────────────────────────────────────────

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

  // ─── Event bridges ───────────────────────────────────────────────────────────
  // Unwrap nativeEvent so callers never have to deal with NativeSyntheticEvent.

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<ChatScrollEventData>) => onScroll?.(e.nativeEvent),
    [onScroll],
  );
  const handleReachTop = useCallback(
    (e: NativeSyntheticEvent<ChatReachTopEventData>) =>
      onReachTop?.(e.nativeEvent),
    [onReachTop],
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
  const handleSendMessage = useCallback(
    (e: NativeSyntheticEvent<ChatSendMessageEventData>) =>
      onSendMessage?.(e.nativeEvent),
    [onSendMessage],
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

  // ─── Non-iOS fallback ─────────────────────────────────────────────────────────

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
      initialScrollId={initialScrollId}
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
  unsupported: { flex: 1, backgroundColor: "#f0f0f0" },
});
