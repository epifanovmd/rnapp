import React, { FC, memo, ReactNode } from "react";
import { Pressable, View, ViewStyle } from "react-native";

import { emojiOnlyCount, IChatViewTheme, IParsedChatMessage } from "../model";
import { useChatViewContext } from "./chat-view-context";
import { ChatText } from "./ChatText";
import {
  EmojiContent,
  FileContent,
  MediaGridContent,
  PollContent,
  TextContent,
  VoiceContent,
} from "./content";
import { MessageFooter } from "./MessageFooter";
import { ReactionsRow } from "./ReactionsRow";
import { IResolvedReply, ReplyPreview } from "./ReplyPreview";
import { ThreadIndicator } from "./ThreadIndicator";

/**
 * Порт MessageBubbleView: вертикальный стек — имя отправителя, пересланное
 * (акцентная полоска), цитата, контент (медиа+текст), тред, реакции, футер.
 */

const bubbleColorFor = (
  msg: IParsedChatMessage,
  theme: IChatViewTheme,
): string => {
  switch (msg.ownership) {
    case "mine":
      return theme.outgoingBubble;
    case "theirs":
      return theme.incomingBubble;
    case "system":
      return theme.systemBubble;
    case "pinned":
      return theme.pinnedBubble;
  }
};

interface IMessageBubbleProps {
  message: IParsedChatMessage;
  resolvedReply?: IResolvedReply;
  /** Максимальная ширина пузыря (уже с учётом аватара). */
  maxBubbleWidth: number;
}

export const MessageBubble: FC<IMessageBubbleProps> = memo(
  ({ message, resolvedReply, maxBubbleWidth }) => {
    const { theme, layout, features, delegate } = useChatViewContext();

    const body = message.body;
    const isEmojiOnly = !body.media && emojiOnlyCount(body.text) !== null;
    const isForwarded =
      features.showForwardedMark && message.forwardedFrom != null;
    const hasReply = features.showReplyPreview && message.reply != null;
    const showName =
      message.senderName != null &&
      (features.senderNameMode === "always"
        ? message.ownership === "mine" || message.ownership === "theirs"
        : features.senderNameMode === "incomingOnly" &&
          message.ownership === "theirs");

    const forwardedInset = isForwarded
      ? layout.forwardedAccentWidth + layout.forwardedContentInset
      : 0;
    const innerWidth = maxBubbleWidth - layout.bubbleHPad * 2 - forwardedInset;

    const hasMedia = body.media != null;

    // Порт contentPreferredWidth: голосовое сжимает пузырь по контенту,
    // остальные медиа занимают всю доступную ширину.
    const preferredMediaWidth =
      body.media?.type === "voice"
        ? Math.min(
            layout.voicePlaySize +
              layout.voiceContentSpacing +
              layout.voiceWaveformWidth +
              layout.voiceWaveformTrailingInset +
              layout.bubbleHPad * 2,
            maxBubbleWidth,
          )
        : null;

    const contentChildren: ReactNode[] = [];

    if (isEmojiOnly) {
      contentChildren.push(
        <EmojiContent
          key="emoji"
          text={body.text!}
          emojiCount={emojiOnlyCount(body.text)!}
        />,
      );
    } else {
      if (body.media) {
        switch (body.media.type) {
          case "images":
            contentChildren.push(
              <MediaGridContent
                key="media"
                messageId={message.id}
                media={body.media.items}
                width={innerWidth}
              />,
            );
            break;
          case "voice":
            contentChildren.push(
              <VoiceContent
                key="voice"
                messageId={message.id}
                url={body.media.url}
                duration={body.media.duration}
                waveform={body.media.waveform}
                ownership={message.ownership}
              />,
            );
            break;
          case "poll":
            contentChildren.push(
              <PollContent
                key="poll"
                messageId={message.id}
                poll={body.media.poll}
                ownership={message.ownership}
              />,
            );
            break;
          case "files":
            contentChildren.push(
              <View key="files" style={{ gap: layout.fileRowSpacing }}>
                {body.media.items.map((file, i) => (
                  <FileContent
                    key={i}
                    messageId={message.id}
                    file={file}
                    ownership={message.ownership}
                  />
                ))}
              </View>,
            );
            break;
        }
      }

      if (body.text && body.text.length > 0) {
        contentChildren.push(
          <View
            key="text"
            style={hasMedia ? { marginTop: layout.mixedContentSpacing } : null}
          >
            <TextContent
              messageId={message.id}
              text={body.text}
              ownership={message.ownership}
            />
          </View>,
        );
      }
    }

    const inner = (
      <>
        {showName && (
          <ChatText
            font={layout.senderNameFont}
            color={theme.incomingSenderName}
          >
            {message.senderName}
          </ChatText>
        )}

        {isForwarded ? (
          <View style={rowStyle}>
            <View
              style={{
                width: layout.forwardedAccentWidth,
                borderRadius: layout.forwardedAccentWidth / 2,
                backgroundColor:
                  message.ownership === "mine"
                    ? theme.outgoingForwardedAccent
                    : theme.incomingForwardedAccent,
              }}
            />
            <View
              style={[
                forwardedColumnStyle,
                {
                  marginLeft: layout.forwardedContentInset,
                  gap: layout.bubbleSpacing,
                },
              ]}
            >
              <ChatText
                font={layout.forwardedFont}
                color={
                  message.ownership === "mine"
                    ? theme.outgoingForwardedLabel
                    : theme.incomingForwardedLabel
                }
              >
                {`Переслано от ${message.forwardedFrom}`}
              </ChatText>
              {hasReply && (
                <ReplyPreview
                  reply={message.reply!}
                  resolved={resolvedReply}
                  ownership={message.ownership}
                />
              )}
              <View>{contentChildren}</View>
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
            <View>{contentChildren}</View>
          </>
        )}

        {features.showThreadIndicator && message.thread && (
          <ThreadIndicator messageId={message.id} thread={message.thread} />
        )}

        {features.showReactions && message.reactions.length > 0 && (
          <ReactionsRow messageId={message.id} reactions={message.reactions} />
        )}

        {!isEmojiOnly && <MessageFooter message={message} />}
      </>
    );

    const bubbleStyle: ViewStyle = isEmojiOnly
      ? {
          maxWidth: maxBubbleWidth,
          paddingTop: layout.bubbleVPad,
          paddingBottom: layout.bubbleBottomPad,
          paddingHorizontal: layout.bubbleHPad,
          gap: layout.bubbleSpacing,
        }
      : {
          maxWidth: maxBubbleWidth,
          minWidth: hasMedia
            ? (preferredMediaWidth ?? maxBubbleWidth)
            : layout.bubbleMinWidth,
          borderRadius: layout.bubbleCornerRadius,
          backgroundColor: bubbleColorFor(message, theme),
          overflow: "hidden",
          paddingTop: layout.bubbleVPad,
          paddingBottom: layout.bubbleBottomPad,
          paddingHorizontal: layout.bubbleHPad,
          gap: layout.bubbleSpacing,
        };

    return (
      <Pressable
        style={bubbleStyle}
        onPress={() => delegate.current?.onTapMessage(message.id)}
      >
        {inner}
      </Pressable>
    );
  },
);

MessageBubble.displayName = "MessageBubble";

const rowStyle: ViewStyle = { flexDirection: "row", alignItems: "stretch" };
const forwardedColumnStyle: ViewStyle = { flex: 1 };
