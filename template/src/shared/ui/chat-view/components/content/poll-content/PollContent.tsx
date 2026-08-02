import React, { FC, memo, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ChatMessageOwnership, ChatPoll } from "../../../types";
import { useChatViewContext } from "../../chat-view-context";
import { PollOptionRow } from "./PollOptionRow";

/**
 * Опрос: вопрос, подзаголовок, варианты и футер «N голосов» + «Результаты»
 * (последнее скрыто у анонимных).
 */

/** Закрытый опрос перекрывает остальные признаки подзаголовка. */
const pollSubtitle = (poll: ChatPoll): string => {
  if (poll.isClosed) return "Опрос завершён";

  const parts = ["Опрос"];

  if (poll.isMultipleChoice) parts.push("множественный выбор");
  if (poll.isAnonymous) parts.push("анонимный");

  return parts.join(" · ");
};

interface IPollContentProps {
  messageId: string;
  poll: ChatPoll;
  ownership: ChatMessageOwnership;
}

export const PollContent: FC<IPollContentProps> = memo(
  ({ messageId, poll, ownership }) => {
    const { layout, styles, delegate } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const selectedIds = poll.selectedOptionIds;

    const handleOptionPress = useCallback(
      (optionId: string) =>
        delegate.current?.onPollOptionTap(messageId, poll.id, optionId),
      [delegate, messageId, poll.id],
    );

    const handleDetailPress = useCallback(
      () => delegate.current?.onPollDetailTap(messageId, poll.id),
      [delegate, messageId, poll.id],
    );

    return (
      <View>
        <Text style={s.pollQuestion}>{poll.question}</Text>
        <Text style={styles.shared.pollSubtitle}>{pollSubtitle(poll)}</Text>

        <View style={{ marginTop: layout.pollHeaderSpacing }}>
          {poll.options.map((option, i) => (
            <View
              key={option.id}
              style={
                i > 0 ? { marginTop: layout.pollOptionSpacing } : undefined
              }
            >
              <PollOptionRow
                option={option}
                isSelected={selectedIds?.includes(option.id) ?? false}
                isClosed={poll.isClosed ?? false}
                ownership={ownership}
                onPress={handleOptionPress}
              />
            </View>
          ))}
        </View>

        <View style={ss.footer}>
          <Text style={s.pollVotes}>{`${poll.totalVotes} голосов`}</Text>
          {!poll.isAnonymous && (
            <Text
              suppressHighlighting
              style={s.pollResults}
              onPress={handleDetailPress}
            >
              {"Результаты"}
            </Text>
          )}
        </View>
      </View>
    );
  },
);

PollContent.displayName = "PollContent";

const ss = StyleSheet.create({
  footer: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
