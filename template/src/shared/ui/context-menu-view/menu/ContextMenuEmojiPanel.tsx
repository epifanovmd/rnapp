import React, { FC, memo, useCallback } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CONTEXT_MENU_EMOJI_PANEL_PADDING } from "../utils";
import { IContextMenuTheme } from "../utils";

const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

const PRESSED_SCALE = 0.8;

interface IEmojiButtonProps {
  emoji: string;
  theme: IContextMenuTheme;
  onPress: (emoji: string) => void;
}

const EmojiButton: FC<IEmojiButtonProps> = memo(({ emoji, theme, onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(PRESSED_SCALE, {
      duration: 100,
      easing: EASE_IN_OUT,
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
      <Animated.View
        style={[
          ss.item,
          { width: theme.emojiItemSize, height: theme.emojiItemSize },
          animatedStyle,
        ]}
      >
        <Text
          style={{ fontSize: theme.emojiFontSize }}
          allowFontScaling={false}
        >
          {emoji}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

export interface IContextMenuEmojiPanelProps {
  emojis: string[];
  theme: IContextMenuTheme;
  onEmojiTap: (emoji: string) => void;
}

export const ContextMenuEmojiPanel: FC<IContextMenuEmojiPanelProps> = memo(
  ({ emojis, theme, onEmojiTap }) => (
    <Animated.View
      style={[
        ss.panel,
        {
          backgroundColor: theme.emojiPanelBackground,
          borderRadius: theme.emojiPanelCornerRadius,
          shadowColor: theme.emojiPanelShadowColor,
          shadowOpacity: theme.emojiPanelShadowOpacity,
          shadowRadius: theme.emojiPanelShadowRadius,
        },
      ]}
    >
      {emojis.map((emoji, index) => (
        <EmojiButton
          key={`${emoji}-${index}`}
          emoji={emoji}
          theme={theme}
          onPress={onEmojiTap}
        />
      ))}
    </Animated.View>
  ),
);

const ss = StyleSheet.create({
  panel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: CONTEXT_MENU_EMOJI_PANEL_PADDING,
    borderCurve: "continuous",
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
});
