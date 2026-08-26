import React, { FC, memo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useInputBarSkin } from "../../hooks";
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
    const { styles } = useInputBarSkin();

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: alpha.value,
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View
        pointerEvents={enabled ? "auto" : "none"}
        style={[ss.wrap, animatedStyle]}
      >
        <Pressable style={styles.sendButton} onPress={onPress}>
          <InputIcon
            name="arrow.up"
            size={14}
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
  wrap: { position: "absolute", right: 4, bottom: 4 },
});
