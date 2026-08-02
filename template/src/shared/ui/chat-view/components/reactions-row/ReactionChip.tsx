import React, { FC, memo, useCallback } from "react";
import { Pressable, Text } from "react-native";

import { ChatMessage } from "../../types";
import { useChatViewContext } from "../chat-view-context";

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
        <Text style={styles.shared.reactionText}>
          {`${reaction.emoji} ${reaction.count}`}
        </Text>
      </Pressable>
    );
  },
);

ReactionChip.displayName = "ReactionChip";
