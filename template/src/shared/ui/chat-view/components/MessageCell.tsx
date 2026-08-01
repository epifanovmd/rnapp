import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { ContextMenuView } from "../../context-menu-view";
import { IParsedChatMessage, messageAlignment } from "../model";
import { ChatViewContext, useChatViewContext } from "./chat-view-context";
import { ChatAvatar } from "./ChatAvatar";
import { MessageBubble } from "./MessageBubble";
import { IResolvedReply } from "./ReplyPreview";

/**
 * Порт MessageCell: выравнивание пузыря по ownership, аватар (последнее
 * сообщение группы), контекстное меню по долгому нажатию (ContextMenuView —
 * на iOS нативное, на Android JS-порт), подсветка scrollToMessage.
 */

interface IMessageCellProps {
  message: IParsedChatMessage;
  resolvedReply?: IResolvedReply;
  /** Ячейка — последняя в группе подряд идущих сообщений отправителя. */
  avatarAnchor: boolean;
}

const HighlightOverlay: FC<{ messageId: string }> = memo(({ messageId }) => {
  const { theme, layout, cellStore } = useChatViewContext();

  const snapshot = useSyncExternalStore(
    cellStore.subscribe,
    useCallback(
      () =>
        cellStore.highlightId === messageId ? cellStore.highlightToken : 0,
      [cellStore, messageId],
    ),
  );

  const opacity = useSharedValue(0);

  useEffect(() => {
    if (snapshot === 0) return;

    opacity.value = withTiming(1, {
      duration: layout.highlightAnimateIn * 1000,
    });
    opacity.value = withDelay(
      layout.highlightAnimateIn * 1000 + layout.highlightDelay * 1000,
      withTiming(0, { duration: layout.highlightAnimateOut * 1000 }),
    );

    const total =
      (layout.highlightAnimateIn +
        layout.highlightDelay +
        layout.highlightAnimateOut) *
      1000;
    const timeout = setTimeout(
      () => cellStore.clearHighlight(messageId),
      total,
    );

    return () => clearTimeout(timeout);
  }, [snapshot, opacity, layout, cellStore, messageId]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (snapshot === 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: layout.bubbleCornerRadius,
          backgroundColor: theme.messageHighlightColor,
        },
        style,
      ]}
    />
  );
});

HighlightOverlay.displayName = "HighlightOverlay";

export const MessageCell: FC<IMessageCellProps> = memo(
  ({ message, resolvedReply, avatarAnchor }) => {
    const chatContext = useChatViewContext();
    const { theme, layout, features, listWidth, delegate, cellStore } =
      chatContext;

    const alignment = messageAlignment(message.ownership);
    const showAvatar = features.showAvatars && message.ownership === "theirs";
    const avatarSpace = showAvatar
      ? layout.avatarSize +
        layout.avatarLeadingMargin +
        layout.avatarBubbleSpacing
      : 0;

    const maxBubbleWidth =
      Math.max(listWidth, 1) * layout.bubbleMaxWidthRatio - avatarSpace;

    const isBubbleHidden = useSyncExternalStore(
      cellStore.subscribe,
      useCallback(
        () => cellStore.isBubbleHidden(message.id),
        [cellStore, message.id],
      ),
    );

    const registerBubble = useCallback(
      (ref: View | null) => cellStore.registerBubble(message.id, ref),
      [cellStore, message.id],
    );

    let extraSpacing = 0;

    if (message.ownership === "system") {
      extraSpacing = layout.systemCellBottomSpacing;
    } else if (message.ownership === "pinned") {
      extraSpacing = layout.pinnedCellBottomSpacing;
    }

    const cellStyle: ViewStyle = {
      minHeight: layout.cellMinHeight,
      paddingTop: layout.cellVSpacing / 2 + extraSpacing,
      paddingBottom: layout.cellVSpacing / 2 + extraSpacing,
      paddingLeft: layout.cellHMargin + avatarSpace,
      paddingRight: layout.cellHMargin,
      flexDirection: "row",
      justifyContent:
        alignment === "trailing"
          ? "flex-end"
          : alignment === "center"
            ? "center"
            : "flex-start",
    };

    const menuEnabled =
      features.contextMenuEnabled &&
      (features.emojiReactions.length > 0 || message.actions.length > 0);

    const bubble = (
      <MessageBubble
        message={message}
        resolvedReply={resolvedReply}
        maxBubbleWidth={maxBubbleWidth}
      />
    );

    const bubbleWrapStyle: ViewStyle = {
      maxWidth: maxBubbleWidth,
      opacity: isBubbleHidden ? 0 : 1,
    };

    return (
      <View style={cellStyle}>
        {showAvatar && avatarAnchor && message.senderName != null && (
          <AvatarSlot message={message} />
        )}
        <View ref={registerBubble} collapsable={false} style={bubbleWrapStyle}>
          {menuEnabled ? (
            <ContextMenuView
              menuId={message.id}
              emojis={features.emojiReactions}
              actions={message.actions}
              theme={theme.isDark ? "dark" : "light"}
              minimumPressDuration={layout.longPressDuration}
              onWillShow={({ menuId }) =>
                delegate.current?.onContextMenuWillShow(menuId)
              }
              onEmojiSelect={({ emoji, menuId }) =>
                delegate.current?.onEmojiSelect(emoji, menuId)
              }
              onActionSelect={({ actionId, menuId }) =>
                delegate.current?.onActionSelect(actionId, menuId)
              }
            >
              {/* Копия пузыря рисуется в оверлее меню — вне провайдера чата,
                  поэтому контекст с темой едет вместе с children. */}
              <ChatViewContext.Provider value={chatContext}>
                {bubble}
              </ChatViewContext.Provider>
            </ContextMenuView>
          ) : (
            bubble
          )}
          <HighlightOverlay messageId={message.id} />
        </View>
      </View>
    );
  },
);

MessageCell.displayName = "MessageCell";

const AvatarSlot: FC<{ message: IParsedChatMessage }> = memo(({ message }) => {
  const { layout } = useChatViewContext();

  return (
    <View
      style={[
        avatarSlotStyle,
        {
          left: layout.avatarLeadingMargin,
          bottom: layout.cellVSpacing / 2,
          width: layout.avatarSize,
          height: layout.avatarSize,
        },
      ]}
    >
      <ChatAvatar
        name={message.senderName ?? ""}
        url={message.senderAvatarUrl}
        size={layout.avatarSize}
      />
    </View>
  );
});

AvatarSlot.displayName = "AvatarSlot";

const avatarSlotStyle: ViewStyle = { position: "absolute" };
