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
} from "react-native";

import type {
  ChatActionPressEventData,
  ChatAttachmentPressEventData,
  ChatCancelInputActionEventData,
  ChatEditMessageEventData,
  ChatEmojiReactionSelectData,
  ChatFabPressEventData,
  ChatInputTypingEventData,
  ChatLinkTapEventData,
  ChatMessagePressEventData,
  ChatPhoneNumberTapEventData,
  ChatPollDetailPressEventData,
  ChatPollOptionPressEventData,
  ChatReachBottomEventData,
  ChatReachTopEventData,
  ChatReactionTapEventData,
  ChatReplyMessagePressEventData,
  ChatScrollAnchorChangedEventData,
  ChatScrollEventData,
  ChatSendMessageEventData,
  ChatThreadTapEventData,
  ChatUnreadMessagesAppearEventData,
  ChatViewCommands,
  ChatViewProps,
  ChatVisibleMessagesChangeEventData,
  ChatVoiceRecordingCompleteEventData,
  IChatViewRef,
  NativeChatInputAction,
  NativeChatViewProps,
} from "../types";

const COMPONENT_NAME = "RNChatView";

const RNChatView = (() => {
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

/**
 * iOS-обёртка над нативным RNChatView. Используется через публичную
 * точку входа ChatView.
 */
export const NativeChatView = forwardRef<IChatViewRef, ChatViewProps>(
  (props, ref) => {
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

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<ChatScrollEventData>) =>
        onScroll?.(e.nativeEvent),
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

    if (!RNChatView) return null;

    return (
      <RNChatView
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
  },
);

NativeChatView.displayName = "NativeChatView";

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
