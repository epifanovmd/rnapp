import React, { FC, memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { resolveContentMinWidth } from "../content";
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
    const { layout, features, styles, contentTypes, actions } =
      useChatViewContext();

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

    // Ширину под себя объявляет дескриптор типа; пузырь типов не знает.
    const minWidth = useMemo(() => {
      if (!media) return layout.bubbleMinWidth;

      return resolveContentMinWidth(contentTypes.get(media.type)?.sizing, {
        layout,
        maxWidth: maxBubbleWidth,
      });
    }, [media, contentTypes, layout, maxBubbleWidth]);

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
            <View
              style={[
                ss.forwardedColumn,
                {
                  marginLeft: layout.forwardedContentInset,
                  gap: layout.bubbleSpacing,
                },
              ]}
            >
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
  // flexShrink вместо flex: flex обнуляет flex-basis, и колонка
  // схлопывается до минимума.
  forwardedColumn: { flexShrink: 1 },
});
