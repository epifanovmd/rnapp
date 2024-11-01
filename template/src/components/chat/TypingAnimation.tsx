import * as React from "react";
import { forwardRef, memo, useEffect, useMemo } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export const TypingAnimation = memo(
  forwardRef<
    Animated.View,
    { text: string; color: ColorValue; style?: StyleProp<ViewStyle> }
  >(({ text, color, style }, ref) => {
    const scale1 = useSharedValue(1);
    const scale2 = useSharedValue(1);
    const scale3 = useSharedValue(1);

    useEffect(() => {
      scale1.value = 1.5;
      setTimeout(() => {
        scale2.value = 1.5;
      }, 300);
      setTimeout(() => {
        scale3.value = 1.5;
      }, 600);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const firstDotStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: withRepeat(
              withTiming(scale1.value, { duration: 600 }),
              -1,
              true,
            ),
          },
        ],
      };
    });

    const secondDotStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: withRepeat(
              withTiming(scale2.value, { duration: 600 }),
              -1,
              true,
            ),
          },
        ],
      };
    });

    const thirdDotStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: withRepeat(
              withTiming(scale3.value, { duration: 600 }),
              -1,
              true,
            ),
          },
        ],
      };
    });

    const _color = useMemo<ViewStyle>(
      () => ({ backgroundColor: color }),
      [color],
    );

    return (
      <Reanimated.View
        ref={ref}
        style={[styles.animationTypingContainer, style]}
      >
        <Reanimated.View style={[styles.dot, _color, firstDotStyle]} />
        <Reanimated.View style={[styles.dot, _color, secondDotStyle]} />
        <Reanimated.View style={[styles.dot, _color, thirdDotStyle]} />
        <Text style={{ color, marginTop: -3, marginLeft: 2 }}>{text}</Text>
      </Reanimated.View>
    );
  }),
);

const styles = StyleSheet.create({
  dot: { height: 3, width: 3, borderRadius: 2, marginRight: 2 },
  animationTypingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
