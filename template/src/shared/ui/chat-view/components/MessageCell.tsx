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
import { JsContextMenuView } from "../../context-menu-view/JsContextMenuView";
import { IParsedChatMessage, messageAlignment } from "../model";
import { ChatViewContext, useChatViewContext } from "./chat-view-context";
import { ChatAvatar } from "./ChatAvatar";
import { MessageBubble } from "./MessageBubble";
import { IResolvedReply } from "./ReplyPreview";

/**
 * Порт MessageCell: выравнивание пузыря по ownership, аватар (последнее
 * сообщение группы, прижатое к низу — как в iOS), контекстное меню по
 * долгому нажатию (ContextMenuView — на iOS нативное, на Android JS-порт),
 * подсветка scrollToMessage.
 */

interface IMessageCellProps {
  message: IParsedChatMessage;
  resolvedReply?: IResolvedReply;
  /** Строка — последняя в группе подряд идущих сообщений отправителя. */
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
      paddingLeft: layout.cellHMargin,
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

    // Делегат живёт в ref и не меняется — обработчики стабильны, и меню
    // не пересоздаётся на каждый рендер ячейки.
    const handleMenuWillShow = useCallback(
      ({ menuId }: { menuId: string }) =>
        delegate.current?.onContextMenuWillShow(menuId),
      [delegate],
    );
    const handleMenuEmojiSelect = useCallback(
      ({ emoji, menuId }: { emoji: string; menuId: string }) =>
        delegate.current?.onEmojiSelect(emoji, menuId),
      [delegate],
    );
    const handleMenuActionSelect = useCallback(
      ({ actionId, menuId }: { actionId: string; menuId: string }) =>
        delegate.current?.onActionSelect(actionId, menuId),
      [delegate],
    );
    const handleMenuDismiss = useCallback(
      ({ menuId }: { menuId: string }) =>
        delegate.current?.onContextMenuDismiss(menuId),
      [delegate],
    );

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

    // Аватар позиционируется «как в iOS»: колонка всегда резервирует место
    // для сообщений пира (пузыри выравниваются по левому краю), а сам аватар
    // рисуется только под последним сообщением группы (avatarAnchor) и прижат
    // к низу ячейки через `alignSelf: flex-end` — обычный поток, без absolute:
    // absolute-аватар в анимируемом списке не следовал за скроллом.
    // Зазор аватар→пузырь = avatarSpace - avatarSize = avatarLeadingMargin +
    // avatarBubbleSpacing (6 + 2 = 8px), как в iMessage.
    const avatarSlotStyle: ViewStyle = {
      width: avatarSpace,
      alignSelf: "flex-end",
    };

    return (
      <View style={cellStyle}>
        {showAvatar && (
          <View style={avatarSlotStyle}>
            {avatarAnchor && message.senderName != null && (
              <ChatAvatar
                name={message.senderName}
                url={message.senderAvatarUrl}
                size={layout.avatarSize}
              />
            )}
          </View>
        )}
        <View ref={registerBubble} collapsable={false} style={bubbleWrapStyle}>
          {menuEnabled ? (
            <JsContextMenuView
              menuId={message.id}
              emojis={features.emojiReactions}
              actions={message.actions}
              theme={theme.isDark ? "dark" : "light"}
              minimumPressDuration={layout.longPressDuration}
              onWillShow={handleMenuWillShow}
              onEmojiSelect={handleMenuEmojiSelect}
              onActionSelect={handleMenuActionSelect}
              onDismiss={handleMenuDismiss}
            >
              {/* Копия пузыря рисуется в оверлее меню — вне провайдера чата,
                  поэтому контекст с темой едет вместе с children. */}
              <ChatViewContext.Provider value={chatContext}>
                {bubble}
              </ChatViewContext.Provider>
            </JsContextMenuView>
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
