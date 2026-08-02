import React, { FC, memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { IParsedChatMessage, IResolvedReply } from "../data";
import { useChatViewContext } from "./chat-view-context";
import { MessageContent } from "./message-content";
import { MessageFooter } from "./MessageFooter";
import { ReactionsRow } from "./reactions-row";
import { ReplyPreview } from "./ReplyPreview";
import { ThreadIndicator } from "./ThreadIndicator";

/**
 * Пузырь сообщения: вертикальный стек из имени отправителя, блока пересылки,
 * цитаты, контента, треда, реакций и футера.
 */

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
    const { layout, features, styles, delegate } = useChatViewContext();

    const s = styles.byOwnership[message.ownership];
    const body = message.body;
    const media = body.media;

    const isForwarded =
      features.showForwardedMark && message.forwardedFrom != null;
    const hasReply = features.showReplyPreview && message.reply != null;

    const forwardedInset = isForwarded
      ? layout.forwardedAccentWidth + layout.forwardedContentInset
      : 0;
    const innerWidth = maxBubbleWidth - layout.bubbleHPad * 2 - forwardedInset;

    // Голосовое сжимает пузырь по своему контенту,
    // остальные медиа занимают всю доступную ширину.
    const minWidth = useMemo(() => {
      if (!media) return layout.bubbleMinWidth;
      if (media.type !== "voice") return maxBubbleWidth;

      return Math.min(
        layout.voicePlaySize +
          layout.voiceContentSpacing +
          layout.voiceWaveformWidth +
          layout.voiceWaveformTrailingInset +
          layout.bubbleHPad * 2,
        maxBubbleWidth,
      );
    }, [media, layout, maxBubbleWidth]);

    const bubbleStyle = useMemo<ViewStyle>(
      () =>
        bubbleless
          ? {
              maxWidth: maxBubbleWidth,
              paddingTop: layout.bubbleVPad,
              paddingBottom: layout.bubbleBottomPad,
              paddingHorizontal: layout.bubbleHPad,
              gap: layout.bubbleSpacing,
            }
          : { maxWidth: maxBubbleWidth, minWidth },
      [bubbleless, maxBubbleWidth, minWidth, layout],
    );

    const handlePress = useCallback(
      () => delegate.current?.onTapMessage(message.id),
      [delegate, message.id],
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
          <Text style={styles.shared.senderName}>{message.senderName}</Text>
        )}

        {isForwarded ? (
          <View style={ss.forwardedRow}>
            <View style={s.forwardedAccent} />
            <View
              style={[
                ss.forwardedColumn,
                {
                  marginLeft: layout.forwardedContentInset,
                  gap: layout.bubbleSpacing,
                },
              ]}
            >
              <Text style={s.forwardedLabel}>
                {`Переслано от ${message.forwardedFrom}`}
              </Text>
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

        {features.showThreadIndicator && message.thread && (
          <ThreadIndicator messageId={message.id} thread={message.thread} />
        )}

        {features.showReactions && message.reactions.length > 0 && (
          <ReactionsRow messageId={message.id} reactions={message.reactions} />
        )}

        {!bubbleless && <MessageFooter message={message} />}
      </Pressable>
    );
  },
);

MessageBubble.displayName = "MessageBubble";

const ss = StyleSheet.create({
  forwardedRow: { flexDirection: "row", alignItems: "stretch" },
  // Именно flexShrink, а не flex: последний обнуляет flex-basis, колонка
  // перестаёт давать собственную ширину и пузырь схлопывается до минимума.
  forwardedColumn: { flexShrink: 1 },
});
