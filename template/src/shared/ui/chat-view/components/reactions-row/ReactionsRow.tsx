import React, { FC, memo, useCallback } from "react";
import { View } from "react-native";

import { ChatMessage } from "../../types";
import { useChatViewContext } from "../chat-view-context";
import { ReactionChip } from "./ReactionChip";

/** Реакции — порт `ReactionsView`: чипы с переносом строк. */

interface IReactionsRowProps {
  messageId: string;
  reactions: NonNullable<ChatMessage["reactions"]>;
}

export const ReactionsRow: FC<IReactionsRowProps> = memo(
  ({ messageId, reactions }) => {
    const { styles, delegate } = useChatViewContext();

    const handlePress = useCallback(
      (emoji: string) => delegate.current?.onReactionTap(messageId, emoji),
      [delegate, messageId],
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
