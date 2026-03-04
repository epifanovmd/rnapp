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
  type NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  StyleSheet,
  UIManager,
  View,
  type ViewStyle,
} from "react-native";

// ─── Re-export native types as public API ─────────────────────────────────────
// Consumers import everything from "ChatView" — no need to touch NativeChatViewSpec.
import type {
  NativeActionPressEventData,
  NativeAttachmentPressEventData,
  NativeChatAction,
  NativeChatMessage,
  NativeMessagePressEventData,
  NativeMessagesVisibleEventData,
  NativeReachTopEventData,
  NativeReplyMessagePressEventData,
  NativeScrollEventData,
  NativeSendMessageEventData,
} from "../../../NativeChatViewSpec";

// ─── Scroll position ──────────────────────────────────────────────────────────

export type ChatScrollPosition = "top" | "center" | "bottom";

// ─── Imperative handle ────────────────────────────────────────────────────────

export interface ChatViewHandle {
  /** Programmatically scroll to the last message. */
  scrollToBottom(): void;

  /**
   * Scroll to a specific message by id.
   * @param messageId             Target message id.
   * @param options.position      "top" | "center" | "bottom"  (default: "center")
   * @param options.animated      Animate the scroll.           (default: true)
   * @param options.highlight     Flash the cell after scroll.  (default: true)
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
  messages: NativeChatMessage[];
  actions?: NativeChatAction[];

  /** Message displayed in the reply-preview bar above the input. */
  replyMessage?: NativeChatMessage | null;

  /**
   * When provided the chat scrolls to this message ID on first render (with highlight)
   * instead of scrolling to the bottom. Consumed once natively; ignored on re-renders.
   */
  initialScrollId?: string;

  /** Distance from bottom (pts) at which the scroll-to-bottom FAB appears. @default 150 */
  scrollToBottomThreshold?: number;

  /** Distance from top (pts) that triggers `onReachTop`. @default 200 */
  topThreshold?: number;

  isLoading?: boolean;

  style?: ViewStyle;

  onScroll?: (event: NativeScrollEventData) => void;
  onReachTop?: (event: NativeReachTopEventData) => void;
  onMessagesVisible?: (event: NativeMessagesVisibleEventData) => void;
  onMessagePress?: (event: NativeMessagePressEventData) => void;
  onActionPress?: (event: NativeActionPressEventData) => void;
  onSendMessage?: (event: NativeSendMessageEventData) => void;
  onAttachmentPress?: (event: NativeAttachmentPressEventData) => void;
  onReplyMessagePress?: (event: NativeReplyMessagePressEventData) => void;
}

// ─── Native component (architecture-agnostic lazy init) ───────────────────────

const COMPONENT_NAME = "RNChatView";

// Try New Architecture first (codegen spec), fall back to Old Architecture.
const NativeChatView = (() => {
  try {
    return require("./NativeChatViewSpec").default;
  } catch {
    return requireNativeComponent(COMPONENT_NAME);
  }
})();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Dispatch a command via the New Architecture Commands API or Old Architecture UIManager. */
function dispatchCommand(
  nativeRef: React.RefObject<React.ElementRef<typeof NativeChatView>>,
  commandName: string,
  args: unknown[],
): void {
  if (Platform.OS !== "ios") return;

  try {
    const { Commands } = require("./NativeChatViewSpec");

    if (Commands?.[commandName] && nativeRef.current) {
      // New Architecture: Commands.scrollToBottom(ref, ...args)
      Commands[commandName](nativeRef.current, ...args);

      return;
    }
  } catch {
    // fall through to Old Architecture
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

const ChatView = forwardRef<ChatViewHandle, ChatViewProps>((props, ref) => {
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

  const nativeRef = useRef<React.ElementRef<typeof NativeChatView>>(null);

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
    (e: NativeSyntheticEvent<NativeScrollEventData>) =>
      onScroll?.(e.nativeEvent),
    [onScroll],
  );
  const handleReachTop = useCallback(
    (e: NativeSyntheticEvent<NativeReachTopEventData>) =>
      onReachTop?.(e.nativeEvent),
    [onReachTop],
  );
  const handleMessagesVisible = useCallback(
    (e: NativeSyntheticEvent<NativeMessagesVisibleEventData>) =>
      onMessagesVisible?.(e.nativeEvent),
    [onMessagesVisible],
  );
  const handleMessagePress = useCallback(
    (e: NativeSyntheticEvent<NativeMessagePressEventData>) =>
      onMessagePress?.(e.nativeEvent),
    [onMessagePress],
  );
  const handleActionPress = useCallback(
    (e: NativeSyntheticEvent<NativeActionPressEventData>) =>
      onActionPress?.(e.nativeEvent),
    [onActionPress],
  );
  const handleSendMessage = useCallback(
    (e: NativeSyntheticEvent<NativeSendMessageEventData>) =>
      onSendMessage?.(e.nativeEvent),
    [onSendMessage],
  );
  const handleAttachmentPress = useCallback(
    (e: NativeSyntheticEvent<NativeAttachmentPressEventData>) =>
      onAttachmentPress?.(e.nativeEvent),
    [onAttachmentPress],
  );
  const handleReplyMessagePress = useCallback(
    (e: NativeSyntheticEvent<NativeReplyMessagePressEventData>) =>
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

export default ChatView;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  unsupported: { flex: 1, backgroundColor: "#f0f0f0" },
});
