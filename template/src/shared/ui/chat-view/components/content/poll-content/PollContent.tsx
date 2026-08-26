import React, { FC, memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { IChatContentProps, IChatPollContent } from "../../../content";
import { useChatViewContext } from "../../../model";
import { ChatPoll } from "../../../types";
import { ChatText } from "../../ChatText";
import { PollOptionRow } from "./PollOptionRow";

/**
 * Опрос: вопрос, подзаголовок, варианты и футер «N голосов» + «Результаты»
 * (последнее скрыто у анонимных).
 */

/** Пропущенное поле `isAnonymous` трактуется как `true`. */
const isPollAnonymous = (poll: ChatPoll): boolean => poll.isAnonymous ?? true;

/** Закрытый опрос перекрывает остальные признаки подзаголовка. */
const pollSubtitle = (poll: ChatPoll): string => {
  if (poll.isClosed) return "Опрос завершён";

  const parts = ["Опрос"];

  if (poll.isMultipleChoice) parts.push("множественный выбор");
  if (isPollAnonymous(poll)) parts.push("анонимный");

  return parts.join(" · ");
};

export const PollContent: FC<IChatContentProps<IChatPollContent>> = memo(
  ({ content, ownership, emit }) => {
    const { styles } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const poll = content.poll;
    const selectedIds = poll.selectedOptionIds;

    const handleOptionPress = useCallback(
      (optionId: string) =>
        emit("builtin.poll.option.tap", { pollId: poll.id, optionId }),
      [emit, poll.id],
    );

    const handleDetailPress = useCallback(
      () => emit("builtin.poll.detail.tap", { pollId: poll.id }),
      [emit, poll.id],
    );

    return (
      <View>
        <ChatText style={s.pollQuestion}>{poll.question}</ChatText>
        <ChatText style={styles.shared.pollSubtitle}>
          {pollSubtitle(poll)}
        </ChatText>

        <View style={ss.options}>
          {poll.options.map((option, i) => (
            <View key={option.id} style={i > 0 ? ss.optionGap : undefined}>
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
          <ChatText
            style={s.pollVotes}
          >{`${poll.totalVotes} голосов`}</ChatText>
          {!isPollAnonymous(poll) && (
            <ChatText
              suppressHighlighting
              style={s.pollResults}
              onPress={handleDetailPress}
            >
              {"Результаты"}
            </ChatText>
          )}
        </View>
      </View>
    );
  },
);

PollContent.displayName = "PollContent";

const ss = StyleSheet.create({
  options: { marginTop: 10 },
  optionGap: { marginTop: 4 },
  footer: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
