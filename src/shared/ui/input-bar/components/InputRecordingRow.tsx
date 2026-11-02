import React, { FC, memo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useInputBarSkin, useRecordingRowAnimation } from "../hooks";
import { formatRecordTimer } from "../utils";
import { InputIcon } from "./InputIcon";

/**
 * Строка записи: мигающая красная точка, таймер
 * «m:ss,cc» и подсказка «‹ Отмена» с покачиванием.
 */

/** Сдвиг подсказки «Отмена» к центру строки. */
const SLIDE_HINT_OFFSET = 20;

interface IInputRecordingRowProps {
  duration: number;
  slideAlpha: SharedValue<number>;
  /** Запись зафиксирована замком — подсказка отмены больше не нужна. */
  slideHidden: boolean;
  onCancelTap: () => void;
}

export const InputRecordingRow: FC<IInputRecordingRowProps> = memo(
  ({ duration, slideAlpha, slideHidden, onCancelTap }) => {
    const { colors, styles } = useInputBarSkin();

    const { dotStyle, slideShift } = useRecordingRowAnimation();

    // Подсказка центрируется по всей строке, а не по остатку места справа от
    // таймера — иначе она уезжает вправо примерно на половину его ширины.
    const slideStyle = useAnimatedStyle(() => ({
      opacity: slideHidden ? 0 : slideAlpha.value,
      transform: [{ translateX: SLIDE_HINT_OFFSET + slideShift.value }],
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
              color={colors.inputPlaceholder}
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
