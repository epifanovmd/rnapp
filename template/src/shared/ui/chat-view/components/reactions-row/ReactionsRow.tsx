import React, { FC, memo, useCallback } from "react";
import { View } from "react-native";

import { useChatViewContext } from "../../model";
import { ChatMessage } from "../../types";
import { ReactionChip } from "./ReactionChip";

/** Реакции: чипы с переносом строк. */

interface IReactionsRowProps {
  messageId: string;
  reactions: NonNullable<ChatMessage["reactions"]>;
}

export const ReactionsRow: FC<IReactionsRowProps> = memo(
  ({ messageId, reactions }) => {
    const { styles, actions } = useChatViewContext();

    const handlePress = useCallback(
      (emoji: string) => actions.current?.onReactionTap(messageId, emoji),
      [actions, messageId],
    );

    return (
      <View style={styles.shared.reactionsWrap}>
        {reactions.map(reaction => (
          <ReactionChip
            key={reaction.emoji}
            reaction={reaction}
            onPress={handlePress}
          />
        ))}
      </View>
    );
  },
);

ReactionsRow.displayName = "ReactionsRow";
