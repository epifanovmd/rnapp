import React, { FC, memo, useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useChatViewContext } from "../../../model";
import { ChatMessageOwnership, ChatPollOption } from "../../../types";
import { withOpacity } from "../../../utils";
import { ChatText } from "../../ChatText";

/**
 * Вариант опроса: полоса заполнения анимируется spring 0.6 с / damping 0.85,
 * но только при обновлении, не при первом показе.
 */

interface IPollOptionRowProps {
  option: ChatPollOption;
  isSelected: boolean;
  isClosed: boolean;
  ownership: ChatMessageOwnership;
  onPress: (optionId: string) => void;
}

export const PollOptionRow: FC<IPollOptionRowProps> = memo(
  ({ option, isSelected, isClosed, ownership, onPress }) => {
    const { theme, styles } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const percentage = Math.max(0.02, option.percentage);
    const fill = useSharedValue(percentage);
    const shownOptionIdRef = useRef<string | undefined>(undefined);

    // Прыжком показываются первый рендер и вариант чужого опроса, попавший
    // в переиспользованную ячейку; анимируется только обновление своего.
    useEffect(() => {
      const isSameOption = shownOptionIdRef.current === option.id;

      shownOptionIdRef.current = option.id;

      if (!isSameOption) {
        fill.value = percentage;

        return;
      }
      fill.value = withSpring(percentage, {
        duration: 600,
        dampingRatio: 0.85,
      });
    }, [option.id, percentage, fill]);

    const fillStyle = useAnimatedStyle(() => ({
      width: `${fill.value * 100}%`,
    }));

    const handlePress = useCallback(
      () => onPress(option.id),
      [onPress, option.id],
    );

    return (
      <Pressable
        disabled={isClosed}
        style={styles.shared.pollBar}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: styles.shared.pollBar.borderRadius,
              backgroundColor: withOpacity(
                theme.pollBarFilled,
                isSelected ? 0.5 : 0.1,
              ),
            },
            fillStyle,
          ]}
        />
        <View style={ss.row}>
          <ChatText
            numberOfLines={1}
            style={isSelected ? s.pollOptionSelected : s.pollOption}
          >
            {option.text}
          </ChatText>
          <ChatText style={isSelected ? s.pollPercentSelected : s.pollPercent}>
            {`${Math.round(option.percentage * 100)}%`}
          </ChatText>
        </View>
      </Pressable>
    );
  },
);

PollOptionRow.displayName = "PollOptionRow";

const ss = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
