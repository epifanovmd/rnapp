import { useListScrollSize } from "@legendapp/list/react-native";
import React, { FC, memo, useCallback, useMemo } from "react";
import { View, ViewStyle } from "react-native";

import { ContextMenuView } from "../../../context-menu-view/ContextMenuView";
import { CHAT_AVATAR_SLOT_WIDTH } from "../../config";
import { IParsedChatMessage, IResolvedReply } from "../../data";
import { ChatViewContext, useChatViewContext } from "../../model";
import { ChatAvatar } from "../ChatAvatar";
import { MessageBubble } from "../MessageBubble";
import { HighlightOverlay } from "./HighlightOverlay";

/** Доля ширины списка, которую занимает самый широкий пузырь. */
const BUBBLE_MAX_WIDTH_RATIO = 0.85;

/** Быстрые реакции контекстного меню сообщения. */
const CHAT_EMOJI_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

interface IMessageCellProps {
  message: IParsedChatMessage;
  resolvedReply?: IResolvedReply;
  showSenderName: boolean;
  showAvatar: boolean;
  bubbleless: boolean;
}

/**
 * Ячейка сообщения: выравнивание пузыря по ownership, место под аватар,
 * контекстное меню по долгому нажатию и подсветка `scrollToMessage`.
 *
 * Ширину списка получает через `useListScrollSize`, чтобы не держать её
 * в React-состоянии корня чата.
 */
export const MessageCell: FC<IMessageCellProps> = memo(
  ({ message, resolvedReply, showSenderName, showAvatar, bubbleless }) => {
    const chatContext = useChatViewContext();
    const { styles, actions } = chatContext;

    const { width: listWidth } = useListScrollSize();

    const messageId = message.id;
    const ownStyles = styles.byOwnership[message.ownership];

    const reservesAvatar = message.ownership === "theirs";
    const avatarSpace = reservesAvatar ? CHAT_AVATAR_SLOT_WIDTH : 0;
    const maxBubbleWidth =
      Math.max(listWidth, 1) * BUBBLE_MAX_WIDTH_RATIO - avatarSpace;

    const bubbleWrapStyle = useMemo<ViewStyle>(
      () => ({ maxWidth: maxBubbleWidth }),
      [maxBubbleWidth],
    );

    const menuEnabled = message.actions.length > 0;

    // Делегат живёт в ref и не меняется — обработчики стабильны, меню не
    // пересоздаётся на каждый рендер ячейки.
    const handleMenuWillShow = useCallback(
      () => actions.current?.onContextMenuWillShow(messageId),
      [actions, messageId],
    );
    const handleMenuEmojiSelect = useCallback(
      (emoji: string) => actions.current?.onEmojiSelect(emoji, messageId),
      [actions, messageId],
    );
    const handleMenuActionSelect = useCallback(
      (actionId: string) =>
        actions.current?.onActionSelect(actionId, messageId),
      [actions, messageId],
    );
    const handleMenuDismiss = useCallback(
      () => actions.current?.onContextMenuDismiss(messageId),
      [actions, messageId],
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
        {/* Пустой спейсер под аватар — сдвигает пузырь вправо. */}
        {reservesAvatar && <View style={styles.shared.avatarColumn} />}
        <View style={bubbleWrapStyle}>
          {menuEnabled ? (
            <ContextMenuView
              emojis={CHAT_EMOJI_REACTIONS}
              actions={message.actions}
              onWillShow={handleMenuWillShow}
              onEmojiSelect={handleMenuEmojiSelect}
              onActionSelect={handleMenuActionSelect}
              onDismiss={handleMenuDismiss}
            >
              {/* Контекст чата передаётся в children меню явно. */}
              <ChatViewContext.Provider value={chatContext}>
                {bubble}
              </ChatViewContext.Provider>
            </ContextMenuView>
          ) : (
            bubble
          )}
          <HighlightOverlay key={messageId} messageId={messageId} />
        </View>
        {/* Аватар поверх ячейки (absolute), выровнен по низу пузыря. */}
        {showAvatar && (
          <View style={styles.shared.avatarOverlay} pointerEvents="none">
            <ChatAvatar
              name={message.senderName!}
              url={message.senderAvatarUrl}
              size={36}
            />
          </View>
        )}
      </View>
    );
  },
);

MessageCell.displayName = "MessageCell";
