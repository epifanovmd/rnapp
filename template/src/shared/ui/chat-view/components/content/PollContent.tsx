import React, { FC, memo, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { chatTextBase } from "../../model";
import { ChatMessageOwnership, ChatPoll, ChatPollOption } from "../../types";
import { useChatViewContext } from "../chat-view-context";

/**
 * Порт PollContentView: вопрос, подзаголовок, варианты с анимируемой полосой
 * прогресса (spring 0.6s/damping 0.85 — только при обновлении, не при первом
 * показе), футер «N голосов» + «Результаты» (скрыт для анонимных).
 */

interface IPollOptionRowProps {
  option: ChatPollOption;
  isSelected: boolean;
  isClosed: boolean;
  ownership: ChatMessageOwnership;
  onOptionTap: (optionId: string) => void;
}

const PollOptionRow: FC<IPollOptionRowProps> = memo(
  ({ option, isSelected, isClosed, ownership, onOptionTap }) => {
    const { theme, layout } = useChatViewContext();
    const isOutgoing = ownership === "mine";

    const percentage = Math.max(0.02, option.percentage);
    const fill = useSharedValue(percentage);
    const isFirstRender = useRef(true);

    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        fill.value = percentage;

        return;
      }
      fill.value = withSpring(percentage, {
        duration: 600,
        dampingRatio: 0.85,
      });
    }, [percentage, fill]);

    const fillStyle = useAnimatedStyle(() => ({
      width: `${fill.value * 100}%`,
    }));

    const textColor = isSelected
      ? isOutgoing
        ? theme.outgoingText
        : theme.incomingText
      : isOutgoing
        ? theme.outgoingText
        : theme.incomingText;
    const optionFontWeight = isSelected
      ? ("700" as const)
      : layout.pollOptionFont.fontWeight;
    const pctColor = isSelected
      ? theme.pollBarFilled
      : isOutgoing
        ? theme.outgoingTime
        : theme.incomingTime;

    return (
      <Pressable
        disabled={isClosed}
        style={[
          ss.bar,
          {
            height: layout.pollBarHeight,
            borderRadius: layout.pollBarCornerRadius,
            backgroundColor: theme.pollBarEmpty,
          },
        ]}
        onPress={() => onOptionTap(option.id)}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: layout.pollBarCornerRadius,
              backgroundColor: isSelected
                ? withOpacity(theme.pollBarFilled, 0.5)
                : withOpacity(theme.pollBarFilled, 0.1),
            },
            fillStyle,
          ]}
        />
        <View style={ss.optionRow}>
          <Text
            numberOfLines={1}
            style={[
              chatTextBase,
              ss.optionLabel,
              {
                marginLeft: layout.pollBarHPad,
                fontSize: layout.pollOptionFont.fontSize,
                fontWeight: optionFontWeight,
                color: isSelected ? textColor : withOpacity(textColor, 0.8),
              },
            ]}
          >
            {option.text}
          </Text>
          <Text
            style={[
              chatTextBase,
              ss.percent,
              {
                marginRight: layout.pollBarHPad,
                fontSize: layout.pollPercentFont.fontSize,
                fontWeight: layout.pollPercentFont.fontWeight,
                fontVariant: ["tabular-nums"],
                color: pctColor,
              },
            ]}
          >
            {`${Math.round(option.percentage * 100)}%`}
          </Text>
        </View>
      </Pressable>
    );
  },
);

PollOptionRow.displayName = "PollOptionRow";

/** rgba-обёртка поверх rgb()/#hex цвета темы. */
const withOpacity = (color: string, opacity: number): string => {
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  }
  if (color.startsWith("#") && color.length === 7) {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0");

    return `${color}${alpha}`;
  }

  return color;
};

interface IPollContentProps {
  messageId: string;
  poll: ChatPoll;
  ownership: ChatMessageOwnership;
}

export const PollContent: FC<IPollContentProps> = memo(
  ({ messageId, poll, ownership }) => {
    const { theme, layout, delegate } = useChatViewContext();
    const isOutgoing = ownership === "mine";

    const selectedIds = poll.selectedOptionIds ?? [];

    let subtitle: string;

    if (poll.isClosed) {
      subtitle = "Опрос завершён";
    } else {
      const parts = ["Опрос"];

      if (poll.isMultipleChoice) parts.push("множественный выбор");
      if (poll.isAnonymous) parts.push("анонимный");
      subtitle = parts.join(" · ");
    }

    return (
      <View>
        <Text
          style={[
            chatTextBase,
            {
              fontSize: layout.pollQuestionFont.fontSize,
              fontWeight: layout.pollQuestionFont.fontWeight,
              color: isOutgoing ? theme.outgoingText : theme.incomingText,
            },
          ]}
        >
          {poll.question}
        </Text>
        <Text
          style={[
            chatTextBase,
            ss.subtitle,
            {
              fontSize: layout.pollSubtitleFont.fontSize,
              fontWeight: layout.pollSubtitleFont.fontWeight,
              color: theme.pollSubtitleColor,
            },
          ]}
        >
          {subtitle}
        </Text>

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
                isSelected={selectedIds.includes(option.id)}
                isClosed={poll.isClosed ?? false}
                ownership={ownership}
                onOptionTap={optionId =>
                  delegate.current?.onPollOptionTap(
                    messageId,
                    poll.id,
                    optionId,
                  )
                }
              />
            </View>
          ))}
        </View>

        <View style={ss.footer}>
          <Text
            style={[
              chatTextBase,
              {
                fontSize: layout.pollVotesFont.fontSize,
                fontWeight: layout.pollVotesFont.fontWeight,
                color: isOutgoing ? theme.outgoingTime : theme.incomingTime,
              },
            ]}
          >
            {`${poll.totalVotes} голосов`}
          </Text>
          {!poll.isAnonymous && (
            <Text
              suppressHighlighting
              style={[
                chatTextBase,
                {
                  fontSize: layout.pollVotesFont.fontSize,
                  fontWeight: layout.pollVotesFont.fontWeight,
                  color: isOutgoing
                    ? theme.outgoingStatusRead
                    : theme.voiceWaveformActive,
                },
              ]}
              onPress={() =>
                delegate.current?.onPollDetailTap(messageId, poll.id)
              }
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
  bar: {
    overflow: "hidden",
    justifyContent: "center",
  },
  percent: {
    marginLeft: 6,
  },
  subtitle: {
    marginTop: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLabel: {
    flexShrink: 1,
  },
  footer: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
