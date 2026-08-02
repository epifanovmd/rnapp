import React, { FC, memo, useCallback } from "react";
import { Pressable } from "react-native";

import { useChatViewContext } from "../../model";
import { ChatMessage } from "../../types";
import { ChatText } from "../ChatText";

/** Чип реакции: у выбранной — акцентный фон и рамка. */

export type ChatReaction = NonNullable<ChatMessage["reactions"]>[number];

interface IReactionChipProps {
  reaction: ChatReaction;
  onPress: (emoji: string) => void;
}

export const ReactionChip: FC<IReactionChipProps> = memo(
  ({ reaction, onPress }) => {
    const { styles } = useChatViewContext();

    const handlePress = useCallback(
      () => onPress(reaction.emoji),
      [onPress, reaction.emoji],
    );

    return (
      <Pressable
        style={
          reaction.isSelected
            ? styles.shared.reactionChipSelected
            : styles.shared.reactionChip
        }
        onPress={handlePress}
      >
        <ChatText style={styles.shared.reactionText}>
          {`${reaction.emoji} ${reaction.count}`}
        </ChatText>
      </Pressable>
    );
  },
);

ReactionChip.displayName = "ReactionChip";
