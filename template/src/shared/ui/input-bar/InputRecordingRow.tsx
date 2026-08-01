import React, { FC, memo, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useChatViewContext } from "../chat-view/components/chat-view-context";
import { ChatIcon } from "../chat-view/components/ChatIcon";
import { chatTextBase, formatRecordTimer } from "../chat-view/model";

/**
 * Порт InputBarRecordingRow: мигающая красная точка, таймер «m:ss,cc»,
 * подсказка «‹ Отмена» с покачиванием (тап по ней отменяет запись).
 */

interface IInputRecordingRowProps {
  duration: number;
  /** Прозрачность подсказки «Отмена» — управляется жестом перетаскивания. */
  slideAlpha: SharedValue<number>;
  /** Скрыта ли подсказка (locked-режим). */
  slideHidden: boolean;
  onCancelTap: () => void;
}

export const InputRecordingRow: FC<IInputRecordingRowProps> = memo(
  ({ duration, slideAlpha, slideHidden, onCancelTap }) => {
    const { theme, layout } = useChatViewContext();

    const dotAlpha = useSharedValue(1);
    const slideShift = useSharedValue(0);

    useEffect(() => {
      dotAlpha.value = withRepeat(
        withTiming(layout.recordDotMinAlpha, { duration: 500 }),
        -1,
        true,
      );
      slideShift.value = withRepeat(
        withTiming(-8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );

      return () => {
        cancelAnimation(dotAlpha);
        cancelAnimation(slideShift);
      };
    }, [dotAlpha, slideShift, layout.recordDotMinAlpha]);

    const dotStyle = useAnimatedStyle(() => ({ opacity: dotAlpha.value }));
    const slideStyle = useAnimatedStyle(() => ({
      opacity: slideHidden ? 0 : slideAlpha.value,
      transform: [{ translateX: slideShift.value }],
    }));

    return (
      <View style={[ss.row, { height: layout.textViewMinHeight }]}>
        <Animated.View
          style={[
            {
              marginLeft: layout.recordDotLeading,
              width: layout.recordDotSize,
              height: layout.recordDotSize,
              borderRadius: layout.recordDotSize / 2,
              backgroundColor: theme.inputRecordingDot,
            },
            dotStyle,
          ]}
        />
        <Text
          style={[
            chatTextBase,
            {
              marginLeft: layout.recordTimerLeading,
              fontSize: layout.recordTimerFont.fontSize,
              fontWeight: layout.recordTimerFont.fontWeight,
              fontVariant: ["tabular-nums"],
              color: theme.inputText,
            },
          ]}
        >
          {formatRecordTimer(duration)}
        </Text>

        <Animated.View
          style={[
            ss.slideWrap,
            { marginLeft: layout.recordSlideHintOffset },
            slideStyle,
          ]}
        >
          <Pressable style={ss.slideInner} onPress={onCancelTap}>
            <ChatIcon
              name="chevron.left"
              size={14}
              color={theme.inputPlaceholder}
              strokeWidth={3}
            />
            <Text
              style={[
                chatTextBase,
                ss.cancelText,
                {
                  fontSize: layout.recordCancelFont.fontSize,
                  fontWeight: layout.recordCancelFont.fontWeight,
                  color: theme.inputPlaceholder,
                },
              ]}
            >
              {"Отмена"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  },
);

InputRecordingRow.displayName = "InputRecordingRow";

const ss = StyleSheet.create({
  cancelText: {
    marginLeft: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  slideWrap: {
    flex: 1,
    alignItems: "center",
  },
  slideInner: {
    flexDirection: "row",
    alignItems: "center",
  },
});
