import React, { FC, memo } from "react";

import { useChatViewContext } from "../../model";
import { ChatText } from "../ChatText";

/**
 * Сообщение из 1–3 эмодзи: крупный шрифт, без фона пузыря.
 */

interface IEmojiContentProps {
  text: string;
  emojiCount: number;
}

export const EmojiContent: FC<IEmojiContentProps> = memo(
  ({ text, emojiCount }) => {
    const { styles } = useChatViewContext();

    return (
      <ChatText style={styles.shared.emoji[Math.min(emojiCount, 3) - 1]}>
        {text}
      </ChatText>
    );
  },
);

EmojiContent.displayName = "EmojiContent";
