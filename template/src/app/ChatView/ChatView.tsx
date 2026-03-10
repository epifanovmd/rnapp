// ChatView.tsx
// UPDATED: добавлены emojiReactions проп и onEmojiReactionSelect колбэк
// для кастомного контекстного меню.

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
  requireNativeComponent,
  StyleSheet,
  UIManager,
  View,
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
  NativeChatImageItem as ChatImageItem,
  NativeChatInputAction,
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
  ChatImageItem,
  ChatInputAction,
  ChatInputActionType,
  ChatMessage,
  ChatMessagePressEventData,
  ChatMessagesVisibleEventData,
  ChatReachTopEventData,
  ChatReplyMessagePressEventData,
  ChatReplyRef,
  ChatScrollEventData,
  ChatScrollPosition,
  ChatSendMessageEventData,
  ChatTheme,
  ChatViewCommands,
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
  actions?: ChatAction[];

  /**
   * Список эмодзи для панели контекстного меню.
   * При долгом нажатии на сообщение отображается emoji-панель с этими эмодзи.
   * Пример: ["❤️", "👍", "😂", "😮", "😢", "🙏"]
   */
  emojiReactions?: string[];

  inputAction?: ChatInputAction | null;
  initialScrollId?: string;
  scrollToBottomThreshold?: number;
  topThreshold?: number;
  isLoading?: boolean;
  theme?: ChatTheme;
  style?: ViewStyle;
  collectionInsetTop?: number;
  collectionInsetBottom?: number;

  onScroll?: (event: ChatScrollEventData) => void;
  onReachTop?: (event: ChatReachTopEventData) => void;
  onMessagesVisible?: (event: ChatMessagesVisibleEventData) => void;
  onMessagePress?: (event: ChatMessagePressEventData) => void;
  onActionPress?: (event: ChatActionPressEventData) => void;

  /**
   * Вызывается при выборе эмодзи в контекстном меню.
   * event.emoji — выбранный эмодзи, event.messageId — id сообщения.
   */
  onEmojiReactionSelect?: (event: ChatEmojiReactionSelectData) => void;

  onSendMessage?: (event: ChatSendMessageEventData) => void;
  onEditMessage?: (event: ChatEditMessageEventData) => void;
  onCancelInputAction?: (event: ChatCancelInputActionEventData) => void;
  onAttachmentPress?: (event: ChatAttachmentPressEventData) => void;
  onReplyMessagePress?: (event: ChatReplyMessagePressEventData) => void;
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
    actions = [],
    emojiReactions = [],
    inputAction,
    initialScrollId,
    scrollToBottomThreshold = 150,
    topThreshold = 200,
    isLoading = false,
    theme = "light",
    style,
    collectionInsetTop,
    collectionInsetBottom,
    onScroll,
    onReachTop,
    onMessagesVisible,
    onMessagePress,
    onActionPress,
    onEmojiReactionSelect,
    onSendMessage,
    onEditMessage,
    onCancelInputAction,
    onAttachmentPress,
    onReplyMessagePress,
  } = props;

  const nativeRef = useRef<React.ComponentRef<typeof NativeChatView>>(null);

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

  const nativeInputAction: NativeChatInputAction = inputAction ?? {
    type: "none",
  };

  return (
    <NativeChatView
      ref={nativeRef}
      style={[styles.fill, style]}
      messages={messages}
      actions={actions}
      emojiReactions={emojiReactions}
      inputAction={nativeInputAction}
      initialScrollId={initialScrollId}
      scrollToBottomThreshold={scrollToBottomThreshold}
      topThreshold={topThreshold}
      isLoading={isLoading}
      theme={theme}
      collectionInsetTop={collectionInsetTop}
      collectionInsetBottom={collectionInsetBottom}
      onScroll={handleScroll}
      onReachTop={handleReachTop}
      onMessagesVisible={handleMessagesVisible}
      onMessagePress={handleMessagePress}
      onActionPress={handleActionPress}
      onEmojiReactionSelect={handleEmojiReactionSelect}
      onSendMessage={handleSendMessage}
      onEditMessage={handleEditMessage}
      onCancelInputAction={handleCancelInputAction}
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
