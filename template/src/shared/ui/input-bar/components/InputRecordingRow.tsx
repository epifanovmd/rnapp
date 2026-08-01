import React, { FC, memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useRecordingRowAnimation } from "../hooks/useRecordingRowAnimation";
import { formatRecordTimer } from "../model/format";
import { useInputBarContext } from "../model/input-bar-context";
import { inputTextBase } from "../model/text-style";
import { InputIcon } from "./InputIcon";

/**
 * Порт InputBarRecordingRow: мигающая красная точка, таймер «m:ss,cc»,
 * подсказка «‹ Отмена» с покачиванием.
 */

interface IInputRecordingRowProps {
  duration: number;
  slideAlpha: SharedValue<number>;
  slideHidden: boolean;
  onCancelTap: () => void;
}

export const InputRecordingRow: FC<IInputRecordingRowProps> = memo(
  ({ duration, slideAlpha, slideHidden, onCancelTap }) => {
    const { theme, layout } = useInputBarContext();

    const { dotStyle, slideShift } = useRecordingRowAnimation();

    // Порт констрейнта slideContainer.centerX == row.centerX + offset:
    // подсказка центрируется по всей строке, а не по остатку места справа от
    // таймера — иначе она уезжает вправо примерно на половину его ширины.
    const slideOffset = layout.recordSlideHintOffset;

    const slideStyle = useAnimatedStyle(() => ({
      opacity: slideHidden ? 0 : slideAlpha.value,
      transform: [{ translateX: slideOffset + slideShift.value }],
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
            inputTextBase,
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
          pointerEvents={"box-none"}
          style={[ss.slideWrap, slideStyle]}
        >
          <Pressable style={ss.slideInner} onPress={onCancelTap}>
            <InputIcon
              name="chevron.left"
              size={14}
              color={theme.inputPlaceholder}
              strokeWidth={3}
            />
            <Text
              style={[
                inputTextBase,
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
  cancelText: { marginLeft: 3 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  slideWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  slideInner: { flexDirection: "row", alignItems: "center" },
});
