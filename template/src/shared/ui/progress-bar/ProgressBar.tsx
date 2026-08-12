import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo, useEffect } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export interface IProgressBarProps extends ViewProps {
  /** Прогресс 0..1; игнорируется при indeterminate. */
  progress?: number;
  /** Бесконечная анимация без известного прогресса. */
  indeterminate?: boolean;
  height?: number;
  color?: keyof TColorTheme;
  trackColor?: keyof TColorTheme;
}

const INDETERMINATE_DURATION = 1200;

export const ProgressBar: FC<IProgressBarProps> = memo(
  ({
    progress = 0,
    indeterminate,
    height = 6,
    color = "primary",
    trackColor = "onSurface",
    style,
    ...rest
  }) => {
    const { colors } = useTheme();
    const value = useSharedValue(0);
    const sweep = useSharedValue(0);

    useEffect(() => {
      value.value = withTiming(Math.min(Math.max(progress, 0), 1), {
        duration: 250,
      });
    }, [progress, value]);

    useEffect(() => {
      if (indeterminate) {
        sweep.value = withRepeat(
          withTiming(1, {
            duration: INDETERMINATE_DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          false,
        );
      } else {
        cancelAnimation(sweep);
        sweep.value = 0;
      }

      return () => cancelAnimation(sweep);
    }, [indeterminate, sweep]);

    const fillStyle = useAnimatedStyle(() => {
      if (indeterminate) {
        return {
          width: "40%",
          transform: [
            {
              translateX: `${interpolate(sweep.value, [0, 1], [-100, 250])}%`,
            },
          ],
        };
      }

      return { width: `${value.value * 100}%`, transform: [] };
    }, [indeterminate]);

    return (
      <View
        accessibilityRole={"progressbar"}
        style={[
          styles.track,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: colors[trackColor],
          },
          style,
        ]}
        {...rest}
      >
        <Animated.View
          style={[
            styles.fill,
            { borderRadius: height / 2, backgroundColor: colors[color] },
            fillStyle,
          ]}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: "100%",
  },
});
