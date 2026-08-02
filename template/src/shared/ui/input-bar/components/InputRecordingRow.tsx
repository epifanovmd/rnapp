import React, { FC, memo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useInputBarContext } from "../config";
import { useRecordingRowAnimation } from "../hooks";
import { formatRecordTimer } from "../utils";
import { InputIcon } from "./InputIcon";

/**
 * Строка записи — порт `InputBarRecordingRow`: мигающая красная точка, таймер
 * «m:ss,cc» и подсказка «‹ Отмена» с покачиванием.
 */

interface IInputRecordingRowProps {
  duration: number;
  slideAlpha: SharedValue<number>;
  /** Запись зафиксирована замком — подсказка отмены больше не нужна. */
  slideHidden: boolean;
  onCancelTap: () => void;
}

export const InputRecordingRow: FC<IInputRecordingRowProps> = memo(
  ({ duration, slideAlpha, slideHidden, onCancelTap }) => {
    const { theme, layout, styles } = useInputBarContext();

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
      <View style={styles.recordingRow}>
        <Animated.View style={[styles.recordingDot, dotStyle]} />
        <Text style={styles.recordingTimer}>{formatRecordTimer(duration)}</Text>

        <Animated.View
          pointerEvents="box-none"
          style={[styles.recordingHintWrap, slideStyle]}
        >
          <Pressable style={styles.recordingHintInner} onPress={onCancelTap}>
            <InputIcon
              name="chevron.left"
              size={14}
              color={theme.inputPlaceholder}
              strokeWidth={3}
            />
            <Text style={styles.recordingHintText}>{"Отмена"}</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  },
);

InputRecordingRow.displayName = "InputRecordingRow";
