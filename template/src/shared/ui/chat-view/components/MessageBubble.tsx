import React, { FC, memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { CHAT_BUBBLE_MIN_WIDTH, resolveContentMinWidth } from "../content";
import { IParsedChatMessage, IResolvedReply } from "../data";
import { useChatViewContext } from "../model";
import { ChatText } from "./ChatText";
import { MessageContent } from "./message-content";
import { MessageFooter } from "./MessageFooter";
import { ReactionsRow } from "./reactions-row";
import { ReplyPreview } from "./ReplyPreview";
import { ThreadIndicator } from "./ThreadIndicator";

/**
 * Пузырь сообщения: вертикальный стек из имени отправителя, блока пересылки,
 * цитаты, контента, треда, реакций и футера.
 */

const BUBBLE_H_PAD = 12;
/** Акцентная полоска пересылки (2.5) плюс отступ до её контента (8). */
const FORWARDED_INSET = 10.5;

interface IMessageBubbleProps {
  message: IParsedChatMessage;
  resolvedReply?: IResolvedReply;
  showSenderName: boolean;
  /** Крупные эмодзи без фона пузыря. */
  bubbleless: boolean;
  /** Максимальная ширина пузыря (уже с учётом места под аватар). */
  maxBubbleWidth: number;
}

export const MessageBubble: FC<IMessageBubbleProps> = memo(
  ({ message, resolvedReply, showSenderName, bubbleless, maxBubbleWidth }) => {
    const { styles, contentTypes, actions } = useChatViewContext();

    const s = styles.byOwnership[message.ownership];
    const body = message.body;
    const media = body.media;

    const isForwarded = message.forwardedFrom != null;
    const hasReply = message.reply != null;

    const forwardedInset = isForwarded ? FORWARDED_INSET : 0;
    const innerWidth = maxBubbleWidth - BUBBLE_H_PAD * 2 - forwardedInset;

    // Ширину под себя объявляет дескриптор типа; пузырь типов не знает.
    const minWidth = useMemo(() => {
      if (!media) return CHAT_BUBBLE_MIN_WIDTH;

      return resolveContentMinWidth(contentTypes.get(media.type)?.sizing, {
        maxWidth: maxBubbleWidth,
      });
    }, [media, contentTypes, maxBubbleWidth]);

    const bubbleStyle = useMemo<ViewStyle>(
      () =>
        bubbleless
          ? { ...ss.bubbleless, maxWidth: maxBubbleWidth }
          : { maxWidth: maxBubbleWidth, minWidth },
      [bubbleless, maxBubbleWidth, minWidth],
    );

    const handlePress = useCallback(
      () => actions.current?.onTapMessage(message.id),
      [actions, message.id],
    );

    const content = (
      <MessageContent message={message} innerWidth={innerWidth} />
    );

    return (
      <Pressable
        style={bubbleless ? bubbleStyle : [s.bubble, bubbleStyle]}
        onPress={handlePress}
      >
        {showSenderName && (
          <ChatText style={styles.shared.senderName}>
            {message.senderName}
          </ChatText>
        )}

        {isForwarded ? (
          <View style={ss.forwardedRow}>
            <View style={s.forwardedAccent} />
            <View style={ss.forwardedColumn}>
              <ChatText style={s.forwardedLabel}>
                {`Переслано от ${message.forwardedFrom}`}
              </ChatText>
              {hasReply && (
                <ReplyPreview
                  reply={message.reply!}
                  resolved={resolvedReply}
                  ownership={message.ownership}
                />
              )}
              {content}
            </View>
          </View>
        ) : (
          <>
            {hasReply && (
              <ReplyPreview
                reply={message.reply!}
                resolved={resolvedReply}
                ownership={message.ownership}
              />
            )}
            {content}
          </>
        )}

        {message.thread && (
          <ThreadIndicator messageId={message.id} thread={message.thread} />
        )}

        {message.reactions.length > 0 && (
          <ReactionsRow messageId={message.id} reactions={message.reactions} />
        )}

        {!bubbleless && <MessageFooter message={message} />}
      </Pressable>
    );
  },
);

MessageBubble.displayName = "MessageBubble";

const ss = StyleSheet.create({
  // Пузырь у крупных эмодзи без фона, но с теми же отступами.
  bubbleless: {
    paddingTop: 6,
    paddingBottom: 5,
    paddingHorizontal: BUBBLE_H_PAD,
    gap: 4,
  },
  forwardedRow: { flexDirection: "row", alignItems: "stretch" },
  // flexShrink вместо flex: flex обнуляет flex-basis, и колонка
  // схлопывается до минимума.
  forwardedColumn: { flexShrink: 1, marginLeft: 8, gap: 4 },
});
