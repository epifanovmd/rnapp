import React, { FC, memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { useChatViewContext } from "../../../model";
import { ChatMessageOwnership, ChatPoll } from "../../../types";
import { ChatText } from "../../ChatText";
import { PollOptionRow } from "./PollOptionRow";

/**
 * Опрос: вопрос, подзаголовок, варианты и футер «N голосов» + «Результаты»
 * (последнее скрыто у анонимных).
 */

/**
 * Анонимность отсутствующего поля.
 *
 * Нативный разбор читает его как `dict["isAnonymous"] as? Bool ?? true`, поэтому
 * пропущенное поле там означает «анонимный». Повторяем этот дефолт, иначе один и
 * тот же опрос выглядит на платформах по-разному: подзаголовок и видимость
 * ссылки «Результаты» зависят именно от него.
 */
const isPollAnonymous = (poll: ChatPoll): boolean => poll.isAnonymous ?? true;

/** Закрытый опрос перекрывает остальные признаки подзаголовка. */
const pollSubtitle = (poll: ChatPoll): string => {
  if (poll.isClosed) return "Опрос завершён";

  const parts = ["Опрос"];

  if (poll.isMultipleChoice) parts.push("множественный выбор");
  if (isPollAnonymous(poll)) parts.push("анонимный");

  return parts.join(" · ");
};

interface IPollContentProps {
  messageId: string;
  poll: ChatPoll;
  ownership: ChatMessageOwnership;
}

export const PollContent: FC<IPollContentProps> = memo(
  ({ messageId, poll, ownership }) => {
    const { layout, styles, actions } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const selectedIds = poll.selectedOptionIds;

    const handleOptionPress = useCallback(
      (optionId: string) =>
        actions.current?.onPollOptionTap(messageId, poll.id, optionId),
      [actions, messageId, poll.id],
    );

    const handleDetailPress = useCallback(
      () => actions.current?.onPollDetailTap(messageId, poll.id),
      [actions, messageId, poll.id],
    );

    return (
      <View>
        <ChatText style={s.pollQuestion}>{poll.question}</ChatText>
        <ChatText style={styles.shared.pollSubtitle}>
          {pollSubtitle(poll)}
        </ChatText>

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
  footer: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
