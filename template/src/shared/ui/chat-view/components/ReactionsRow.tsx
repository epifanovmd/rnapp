import React, { FC, memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { chatTextBase } from "../model";
import { ChatMessage } from "../types";
import { useChatViewContext } from "./chat-view-context";

/**
 * Порт ReactionsView: чипы «эмодзи + счётчик» с переносом строк,
 * выбранная реакция — акцентный фон и рамка.
 */

type ChatReactions = NonNullable<ChatMessage["reactions"]>;

interface IReactionsRowProps {
  messageId: string;
  reactions: ChatReactions;
}

export const ReactionsRow: FC<IReactionsRowProps> = memo(
  ({ messageId, reactions }) => {
    const { theme, layout, delegate } = useChatViewContext();

    return (
      <View style={[ss.wrap, { gap: layout.reactionChipSpacing }]}>
        {reactions.map(reaction => {
          const isSelected = reaction.isSelected ?? false;
          const chipBorderWidth = isSelected ? layout.reactionBorderWidth : 0;

          return (
            <Pressable
              key={reaction.emoji}
              style={[
                ss.chip,
                {
                  height: layout.reactionChipHeight,
                  borderRadius: layout.reactionChipHeight / 2,
                  paddingHorizontal: layout.reactionChipPadding,
                  backgroundColor: isSelected
                    ? theme.reactionMineBackground
                    : theme.reactionBackground,
                  borderWidth: chipBorderWidth,
                  borderColor: isSelected
                    ? theme.reactionMineBorder
                    : undefined,
                },
              ]}
              onPress={() =>
                delegate.current?.onReactionTap(messageId, reaction.emoji)
              }
            >
              <Text
                style={[
                  chatTextBase,
                  {
                    fontSize: layout.reactionFont.fontSize,
                    fontWeight: layout.reactionFont.fontWeight,
                    color: theme.reactionText,
                  },
                ]}
              >
                {`${reaction.emoji} ${reaction.count}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  },
);

ReactionsRow.displayName = "ReactionsRow";

const ss = StyleSheet.create({
  chip: {
    alignItems: "center",
    justifyContent: "center",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
});
