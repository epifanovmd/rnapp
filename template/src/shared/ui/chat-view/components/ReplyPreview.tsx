import React, { FC, memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { IResolvedReply } from "../data";
import { useChatViewContext } from "../model";
import { ChatMessageOwnership, ChatReplyRef } from "../types";
import { ChatText } from "./ChatText";

/**
 * Превью цитаты: акцентная полоска, имя автора и текст оригинала (или
 * «📷 Photo» для вложений).
 */

interface IReplyPreviewProps {
  reply: ChatReplyRef;
  /** Данные оригинала, разрешённые при построении строки. */
  resolved?: IResolvedReply;
  ownership: ChatMessageOwnership;
}

export const ReplyPreview: FC<IReplyPreviewProps> = memo(
  ({ reply, resolved, ownership }) => {
    const { styles, actions } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const text = resolved?.text || reply.text;
    let content: string;

    if (text && text.length > 0) {
      content = text;
    } else if (reply.hasImages || resolved?.hasImage) {
      content = "📷 Photo";
    } else {
      content = "…";
    }

    const handlePress = useCallback(
      () => actions.current?.onReplyTap(reply.id),
      [actions, reply.id],
    );

    return (
      <Pressable style={s.replyCard} onPress={handlePress}>
        <View style={s.replyAccent} />
        <View style={ss.textWrap}>
          <ChatText numberOfLines={1} style={s.replySender}>
            {resolved?.senderName ?? reply.senderName ?? ""}
          </ChatText>
          <ChatText numberOfLines={1} style={s.replyText}>
            {content}
          </ChatText>
        </View>
      </Pressable>
    );
  },
);

ReplyPreview.displayName = "ReplyPreview";

const ss = StyleSheet.create({
  // flexShrink, а не flex: цитата должна отдавать собственную ширину наружу —
  // от неё зависит ширина пузыря.
  textWrap: { flexShrink: 1, paddingHorizontal: 8, paddingTop: 4 },
});
