import { useListScrollSize } from "@legendapp/list/react-native";
import React, { FC, memo, useCallback, useMemo } from "react";
import { View, ViewStyle } from "react-native";

// Тестовое исключение: в ячейке используется именно JS-реализация меню —
// нативное на iOS показывает демо-экран отдельным переключателем.
import { JsContextMenuView } from "../../../context-menu-view/JsContextMenuView";
import { IParsedChatMessage, IResolvedReply } from "../../data";
import { ChatViewContext, useChatViewContext } from "../../model";
import { ChatAvatar } from "../ChatAvatar";
import { MessageBubble } from "../MessageBubble";
import { HighlightOverlay } from "./HighlightOverlay";

/**
 * Ячейка сообщения: выравнивание пузыря по ownership, место под аватар,
 * контекстное меню по долгому нажатию и подсветка `scrollToMessage`.
 *
 * Ширину списка ячейка спрашивает у самого списка (`useListScrollSize`), а не
 * получает пропом сверху: иначе замер ширины в корне чата пришлось бы держать
 * React-состоянием и перерисовывать им весь чат на каждый поворот экрана.
 */
interface IMessageCellProps {
  message: IParsedChatMessage;
  resolvedReply?: IResolvedReply;
  showSenderName: boolean;
  showAvatar: boolean;
  bubbleless: boolean;
}

export const MessageCell: FC<IMessageCellProps> = memo(
  ({ message, resolvedReply, showSenderName, showAvatar, bubbleless }) => {
    const chatContext = useChatViewContext();
    const { theme, layout, features, styles, delegate } = chatContext;

    const { width: listWidth } = useListScrollSize();

    const messageId = message.id;
    const ownStyles = styles.byOwnership[message.ownership];

    const reservesAvatar =
      features.showAvatars && message.ownership === "theirs";
    const avatarSpace = reservesAvatar ? styles.shared.avatarSlotWidth : 0;
    const maxBubbleWidth =
      Math.max(listWidth, 1) * layout.bubbleMaxWidthRatio - avatarSpace;

    const bubbleWrapStyle = useMemo<ViewStyle>(
      () => ({ maxWidth: maxBubbleWidth }),
      [maxBubbleWidth],
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
        {/* Резерв под аватар: пустой спейсер сдвигает пузырь так же, как нативно
            (bubble leading = cellHMargin + avatarSize + avatarLeadingMargin + avatarBubbleSpacing). */}
        {reservesAvatar && <View style={styles.shared.avatarColumn} />}
        <View style={bubbleWrapStyle}>
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
        {/* Аватар поверх ячейки (absolute), как нативный AvatarSupplementaryView:
            left = avatarLeadingMargin, низ = низ пузыря. Высоту ячейки не раздувает. */}
        {showAvatar && (
          <View style={styles.shared.avatarOverlay} pointerEvents="none">
            <ChatAvatar
              name={message.senderName!}
              url={message.senderAvatarUrl}
              size={layout.avatarSize}
            />
          </View>
        )}
      </View>
    );
  },
);

MessageCell.displayName = "MessageCell";
