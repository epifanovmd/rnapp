import React, { FC, memo } from "react";
import { StyleSheet, Text } from "react-native";

import { chatTextBase, IChatFont } from "../../model";
import { useChatViewContext } from "../chat-view-context";

/**
 * Порт emojiView: сообщение из 1–3 эмодзи — крупный шрифт, без фона пузыря.
 */

interface IEmojiContentProps {
  text: string;
  emojiCount: number;
}

export const EmojiContent: FC<IEmojiContentProps> = memo(
  ({ text, emojiCount }) => {
    const { layout } = useChatViewContext();

    let emojiFont: IChatFont;

    if (emojiCount <= 1) {
      emojiFont = layout.emojiFont1;
    } else if (emojiCount === 2) {
      emojiFont = layout.emojiFont2;
    } else {
      emojiFont = layout.emojiFont3;
    }

    return (
      <Text
        style={[
          chatTextBase,
          ss.text,
          {
            fontSize: emojiFont.fontSize,
            lineHeight: emojiFont.fontSize * 1.2,
          },
        ]}
      >
        {text}
      </Text>
    );
  },
);

EmojiContent.displayName = "EmojiContent";

const ss = StyleSheet.create({
  text: {
    textAlign: "center",
  },
});
