import React, { FC, memo, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useInputBarContext } from "../../config";
import { InputIcon } from "../InputIcon";

/** Кнопка отправки внутри поля ввода: проявляется, когда в поле есть текст. */

interface IInputBarSendButtonProps {
  /** Кнопка активна — иначе жмётся микрофон снаружи. */
  enabled: boolean;
  scale: SharedValue<number>;
  alpha: SharedValue<number>;
  onPress: () => void;
}

export const InputBarSendButton: FC<IInputBarSendButtonProps> = memo(
  ({ enabled, scale, alpha, onPress }) => {
    const { layout, styles } = useInputBarContext();

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: alpha.value,
      transform: [{ scale: scale.value }],
    }));

    const positionStyle = useMemo(
      () => ({
        right: layout.inputSendButtonInset,
        bottom: layout.inputSendButtonInset,
      }),
      [layout.inputSendButtonInset],
    );

    return (
      <Animated.View
        pointerEvents={enabled ? "auto" : "none"}
        style={[ss.wrap, positionStyle, animatedStyle]}
      >
        <Pressable style={styles.sendButton} onPress={onPress}>
          <InputIcon
            name="arrow.up"
            size={layout.inputSendButtonIconSize}
            color="#FFFFFF"
            strokeWidth={2.6}
          />
        </Pressable>
      </Animated.View>
    );
  },
);

InputBarSendButton.displayName = "InputBarSendButton";

const ss = StyleSheet.create({
  wrap: { position: "absolute" },
});
