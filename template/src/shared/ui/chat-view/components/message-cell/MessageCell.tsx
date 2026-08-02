import React, {
  FC,
  memo,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import { View, ViewStyle } from "react-native";

// Тестовое исключение: в ячейке используется именно JS-реализация меню —
// нативное на iOS показывает демо-экран отдельным переключателем.
import { JsContextMenuView } from "../../../context-menu-view/JsContextMenuView";
import { IParsedChatMessage, IResolvedReply } from "../../data";
import { ChatViewContext, useChatViewContext } from "../chat-view-context";
import { MessageBubble } from "../MessageBubble";
import { HighlightOverlay } from "./HighlightOverlay";

/**
 * Ячейка сообщения — порт `MessageCell`: выравнивание пузыря по ownership,
 * место под аватар, контекстное меню по долгому нажатию и подсветка
 * `scrollToMessage`.
 */

interface IMessageCellProps {
  message: IParsedChatMessage;
  resolvedReply?: IResolvedReply;
  showSenderName: boolean;
  bubbleless: boolean;
}

export const MessageCell: FC<IMessageCellProps> = memo(
  ({ message, resolvedReply, showSenderName, bubbleless }) => {
    const chatContext = useChatViewContext();
    const { theme, layout, features, styles, listWidth, delegate, cellStore } =
      chatContext;

    const messageId = message.id;
    const ownStyles = styles.byOwnership[message.ownership];

    const reservesAvatar =
      features.showAvatars && message.ownership === "theirs";
    const avatarSpace = reservesAvatar ? styles.shared.avatarSlotWidth : 0;
    const maxBubbleWidth =
      Math.max(listWidth, 1) * layout.bubbleMaxWidthRatio - avatarSpace;

    const isBubbleHidden = useSyncExternalStore(
      cellStore.subscribe,
      useCallback(
        () => cellStore.isBubbleHidden(messageId),
        [cellStore, messageId],
      ),
    );

    const registerBubble = useCallback(
      (ref: View | null) => cellStore.registerBubble(messageId, ref),
      [cellStore, messageId],
    );

    const bubbleWrapStyle = useMemo<ViewStyle>(
      () => ({ maxWidth: maxBubbleWidth, opacity: isBubbleHidden ? 0 : 1 }),
      [maxBubbleWidth, isBubbleHidden],
    );

    const menuEnabled =
      features.contextMenuEnabled &&
      (features.emojiReactions.length > 0 || message.actions.length > 0);

    // Делегат живёт в ref и не меняется — обработчики стабильны, меню не
    // пересоздаётся на каждый рендер ячейки.
    const handleMenuWillShow = useCallback(
      () => delegate.current?.onContextMenuWillShow(messageId),
      [delegate, messageId],
    );
    const handleMenuEmojiSelect = useCallback(
      ({ emoji }: { emoji: string }) =>
        delegate.current?.onEmojiSelect(emoji, messageId),
      [delegate, messageId],
    );
    const handleMenuActionSelect = useCallback(
      ({ actionId }: { actionId: string }) =>
        delegate.current?.onActionSelect(actionId, messageId),
      [delegate, messageId],
    );
    const handleMenuDismiss = useCallback(
      () => delegate.current?.onContextMenuDismiss(messageId),
      [delegate, messageId],
    );

    const bubble = (
      <MessageBubble
        message={message}
        resolvedReply={resolvedReply}
        showSenderName={showSenderName}
        bubbleless={bubbleless}
        maxBubbleWidth={maxBubbleWidth}
      />
    );

    return (
      <View style={ownStyles.cell}>
        {reservesAvatar && <View style={styles.shared.avatarSlot} />}
        <View ref={registerBubble} collapsable={false} style={bubbleWrapStyle}>
          {menuEnabled ? (
            <JsContextMenuView
              menuId={messageId}
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
                  поэтому контекст едет вместе с children. */}
              <ChatViewContext.Provider value={chatContext}>
                {bubble}
              </ChatViewContext.Provider>
            </JsContextMenuView>
          ) : (
            bubble
          )}
          <HighlightOverlay messageId={messageId} />
        </View>
      </View>
    );
  },
);

MessageCell.displayName = "MessageCell";
