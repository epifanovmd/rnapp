import React, { FC, memo } from "react";
import { Pressable } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { INPUT_BAR_BUTTON_SIZE } from "../../config";
import { useInputBarSkin } from "../../hooks";
import { InputIcon } from "../InputIcon";

/**
 * Левая кнопка панели: скрепка, а во время записи — корзина отмены.
 * Всегда в DOM и анимируется width + scale + opacity.
 */

interface IInputBarAttachButtonProps {
  /** Идёт запись или свайп к отмене — кнопка становится корзиной. */
  showTrash: boolean;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  /** Доля от полной ширины кнопки: 0 — схлопнута. */
  width: SharedValue<number>;
  onPress: () => void;
}

export const InputBarAttachButton: FC<IInputBarAttachButtonProps> = memo(
  ({ showTrash, scale, opacity, width, onPress }) => {
    const { colors, styles } = useInputBarSkin();

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      width: width.value * INPUT_BAR_BUTTON_SIZE,
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={animatedStyle}>
        <Pressable style={styles.roundButton} onPress={onPress}>
          <InputIcon
            name={showTrash ? "trash.fill" : "paperclip"}
            size={16}
            color={showTrash ? colors.inputRecordingCancel : colors.inputTint}
          />
        </Pressable>
      </Animated.View>
    );
  },
);

InputBarAttachButton.displayName = "InputBarAttachButton";
