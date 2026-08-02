import React, { FC, memo, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

/**
 * Вращающееся кольцо загрузки по внутреннему контуру круглой кнопки — порт
 * `loadingRing` (CAShapeLayer, дуга 270°, оборот за 0.8 с) из FABManager и
 * VoiceContentView.
 */

interface ILoadingRingProps {
  size: number;
  color: string;
  /** Отступ дуги от края кнопки. */
  inset?: number;
  strokeWidth?: number;
}

/** Дуга 270°, порт `strokeEnd = 0.75`. */
const arcPath = (size: number, inset: number): string => {
  const c = size / 2;
  const r = c - inset;

  return `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - r} ${c}`;
};

export const LoadingRing: FC<ILoadingRingProps> = memo(
  ({ size, color, inset = 4, strokeWidth = 2 }) => {
    const spin = useSharedValue(0);

    useEffect(() => {
      spin.value = 0;
      spin.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
      );

      return () => cancelAnimation(spin);
    }, [spin]);

    const style = useAnimatedStyle(() => ({
      transform: [{ rotate: `${spin.value}deg` }],
    }));

    return (
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, style]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path
            d={arcPath(size, inset)}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    );
  },
);

LoadingRing.displayName = "LoadingRing";
