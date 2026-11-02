import React, { FC, memo, useCallback } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CONTEXT_MENU_EASING, IContextMenuStyles } from "../../config";

/** Кнопка эмодзи: сжатие на нажатии и пружинный возврат. */

/** Во что сжимается эмодзи при нажатии. */
const PRESSED_SCALE = 0.8;

interface IEmojiButtonProps {
  emoji: string;
  styles: IContextMenuStyles;
  onPress: (emoji: string) => void;
}

export const EmojiButton: FC<IEmojiButtonProps> = memo(
  ({ emoji, styles, onPress }) => {
    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
      scale.value = withTiming(PRESSED_SCALE, {
        duration: 100,
        easing: CONTEXT_MENU_EASING,
      });
    }, [scale]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, {
        duration: 200,
        dampingRatio: 0.5,
        velocity: 0.8 * (1 - scale.value),
      });
    }, [scale]);

    const handlePress = useCallback(() => onPress(emoji), [onPress, emoji]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Pressable
        unstable_pressDelay={0}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={[styles.emojiItem, animatedStyle]}>
          <Text style={styles.emojiText} allowFontScaling={false}>
            {emoji}
          </Text>
        </Animated.View>
      </Pressable>
    );
  },
);

EmojiButton.displayName = "EmojiButton";
