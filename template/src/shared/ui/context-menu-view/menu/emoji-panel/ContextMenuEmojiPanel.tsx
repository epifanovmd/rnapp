import React, { FC, memo } from "react";
import Animated from "react-native-reanimated";

import { IContextMenuStyles } from "../../config";
import { EmojiButton } from "./EmojiButton";

/** Панель быстрых реакций — порт `ContextMenuEmojiPanel`. */

export interface IContextMenuEmojiPanelProps {
  emojis: string[];
  styles: IContextMenuStyles;
  onEmojiTap: (emoji: string) => void;
}

export const ContextMenuEmojiPanel: FC<IContextMenuEmojiPanelProps> = memo(
  ({ emojis, styles, onEmojiTap }) => (
    <Animated.View style={styles.emojiPanel}>
      {emojis.map((emoji, index) => (
        <EmojiButton
          key={`${emoji}-${index}`}
          emoji={emoji}
          styles={styles}
          onPress={onEmojiTap}
        />
      ))}
    </Animated.View>
  ),
);

ContextMenuEmojiPanel.displayName = "ContextMenuEmojiPanel";
