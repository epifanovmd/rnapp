import React, { FC, memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChatMessageOwnership, ChatReplyRef } from "../types";
import { useChatViewContext } from "./chat-view-context";

/**
 * Порт ReplyPreviewView: акцентная полоска, имя автора, текст цитаты
 * (или «📷 Photo» для изображений).
 */

export interface IResolvedReply {
  senderName: string;
  text: string;
  hasImage: boolean;
}

interface IReplyPreviewProps {
  reply: ChatReplyRef;
  resolved?: IResolvedReply;
  ownership: ChatMessageOwnership;
}

export const ReplyPreview: FC<IReplyPreviewProps> = memo(
  ({ reply, resolved, ownership }) => {
    const { theme, layout, delegate } = useChatViewContext();
    const isOutgoing = ownership === "mine";

    const sender = resolved?.senderName ?? reply.senderName ?? "";
    const text = resolved?.text || reply.text;

    let content: string;

    if (text && text.length > 0) {
      content = text;
    } else if (reply.hasImages || resolved?.hasImage) {
      content = "📷 Photo";
    } else {
      content = "…";
    }

    return (
      <Pressable
        style={[
          ss.card,
          {
            height: layout.replyHeight,
            borderRadius: layout.replyCornerRadius,
            backgroundColor: isOutgoing
              ? theme.outgoingReplyBackground
              : theme.incomingReplyBackground,
          },
        ]}
        onPress={() => delegate.current?.onReplyTap(reply.id)}
      >
        <View
          style={{
            width: layout.replyAccentWidth,
            backgroundColor: isOutgoing
              ? theme.outgoingReplyAccent
              : theme.incomingReplyAccent,
          }}
        />
        <View style={ss.textWrap}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: layout.replySenderFont.fontSize,
              fontWeight: layout.replySenderFont.fontWeight,
              color: isOutgoing
                ? theme.outgoingReplySender
                : theme.incomingReplySender,
            }}
          >
            {sender}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              marginTop: ss.contentGap.marginTop,
              fontSize: layout.replyFont.fontSize,
              fontWeight: layout.replyFont.fontWeight,
              color: isOutgoing
                ? theme.outgoingReplyText
                : theme.incomingReplyText,
            }}
          >
            {content}
          </Text>
        </View>
      </Pressable>
    );
  },
);

ReplyPreview.displayName = "ReplyPreview";

const ss = StyleSheet.create({
  card: {
    overflow: "hidden",
    flexDirection: "row",
  },
  contentGap: {
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
});
