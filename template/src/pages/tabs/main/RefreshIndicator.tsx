import { IPullToRefreshController } from "@shared/lib/pull-to-refresh";
import { useTheme } from "@shared/lib/theme";
import { AnimatedRefreshing } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const INDICATOR_SIZE = 32;
const SPIN_DURATION = 900;

interface IProps {
  controller: IPullToRefreshController;
  /** Отступ сверху (высота navbar и т.п.) */
  topOffset?: number;
}

/**
 * Визуал pull-to-refresh страницы Main: плавающее кольцо прогресса поверх
 * контента — заполняется при протяжке, вращается во время обновления.
 */
export const RefreshIndicator: FC<IProps> = memo(
  ({ controller, topOffset = 0 }) => {
    const { colors } = useTheme();
    const { pullDistance, progress, state } = controller;
    const rotation = useSharedValue(0);

    useAnimatedReaction(
      () => state.value === "refreshing",
      (isRefreshing, prev) => {
        if (isRefreshing === prev) {
          return;
        }

        if (isRefreshing) {
          rotation.value = 0;
          rotation.value = withRepeat(
            withTiming(360, { duration: SPIN_DURATION, easing: Easing.linear }),
            -1,
          );
        } else {
          cancelAnimation(rotation);
          rotation.value = withTiming(0, { duration: 200 });
        }
      },
    );

    const percentage = useDerivedValue(() => {
      const current = state.value;

      return current === "refreshing" || current === "settling"
        ? 75
        : Math.min(100, progress.value * 100);
    });

    const containerStyle = useAnimatedStyle(() => ({
      opacity: Math.min(1, progress.value),
      transform: [
        { translateY: pullDistance.value - INDICATOR_SIZE * 2 },
        { rotate: `${rotation.value}deg` },
      ],
    }));

    return (
      <Animated.View
        pointerEvents={"none"}
        style={[
          ss.container,
          { top: topOffset, backgroundColor: colors.surface },
          containerStyle,
        ]}
      >
        <AnimatedRefreshing
          radius={INDICATOR_SIZE / 2}
          percentage={percentage}
        />
      </Animated.View>
    );
  },
);

const ss = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 10,
    alignSelf: "center",
    padding: 6,
    borderRadius: INDICATOR_SIZE,
  },
});
