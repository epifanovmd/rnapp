import React, { FC, memo } from "react";
import { View } from "react-native";

import { IParsedChatMessage } from "../../data";
import { useChatViewContext } from "../chat-view-context";
import { EmojiContent, TextContent } from "../content";
import { MessageMedia } from "./MessageMedia";

/**
 * Наполнение пузыря: крупные эмодзи либо медиа и текст друг под другом.
 */

interface IMessageContentProps {
  message: IParsedChatMessage;
  innerWidth: number;
}

export const MessageContent: FC<IMessageContentProps> = memo(
  ({ message, innerWidth }) => {
    const { styles } = useChatViewContext();
    const { text, media, emojiCount } = message.body;

    if (emojiCount != null && text) {
      return <EmojiContent text={text} emojiCount={emojiCount} />;
    }

    return (
      <View>
        <MessageMedia message={message} innerWidth={innerWidth} />
        {!!text && (
          <View style={media ? styles.shared.mixedContentGap : undefined}>
            <TextContent message={message} />
          </View>
        )}
      </View>
    );
  },
);

MessageContent.displayName = "MessageContent";
