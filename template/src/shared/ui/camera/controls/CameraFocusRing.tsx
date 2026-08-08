import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useCameraApi } from "../core/camera-context";

const BORDER_WIDTH = 1.5;
/** Доля стороны рамки, занимаемая уголком */
const CORNER_RATIO = 0.28;

export interface ICameraFocusRingProps {
  size?: number;
  color?: string;
}

/**
 * Индикатор фокуса в точке тапа — квадратная рамка с бордером только по
 * уголкам: появляется со «схлопыванием», держится и плавно гаснет.
 * Реагирует на `focus.focusPulse` из API камеры.
 */
export const CameraFocusRing: FC<ICameraFocusRingProps> = memo(
  ({ size = 76, color = "#FFD60A" }) => {
    const { focus } = useCameraApi();
    const { focusPoint, focusPulse } = focus;

    const progress = useSharedValue(0);

    useAnimatedReaction(
      () => focusPulse.value,
      (pulse, previous) => {
        if (previous == null || pulse === previous) {
          return;
        }

        progress.value = 0;
        progress.value = withSequence(
          withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
          withDelay(650, withTiming(0, { duration: 220 })),
        );
      },
    );

    const frameStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [
        { translateX: focusPoint.value.x - size / 2 },
        { translateY: focusPoint.value.y - size / 2 },
        { scale: interpolate(progress.value, [0, 1], [1.4, 1]) },
      ],
    }));

    const corner = {
      width: size * CORNER_RATIO,
      height: size * CORNER_RATIO,
      borderColor: color,
    };

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents={"none"}>
        <Animated.View
          style={[styles.frame, { width: size, height: size }, frameStyle]}
        >
          <View style={[styles.corner, styles.topLeft, corner]} />
          <View style={[styles.corner, styles.topRight, corner]} />
          <View style={[styles.corner, styles.bottomLeft, corner]} />
          <View style={[styles.corner, styles.bottomRight, corner]} />
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  frame: {
    position: "absolute",
  },
  corner: {
    position: "absolute",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
  },
});
