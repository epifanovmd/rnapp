import React, { FC, memo } from "react";
import { Text } from "react-native";

import { useChatViewContext } from "../chat-view-context";

/**
 * Сообщение из 1–3 эмодзи — порт `emojiView`: крупный шрифт, без фона пузыря.
 */

interface IEmojiContentProps {
  text: string;
  emojiCount: number;
}

export const EmojiContent: FC<IEmojiContentProps> = memo(
  ({ text, emojiCount }) => {
    const { styles } = useChatViewContext();

    return (
      <Text style={styles.shared.emoji[Math.min(emojiCount, 3) - 1]}>
        {text}
      </Text>
    );
  },
);

EmojiContent.displayName = "EmojiContent";
