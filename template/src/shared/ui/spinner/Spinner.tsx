import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import Animated from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useSpinnerAnimation } from "./hooks";
import { ISpinnerProps } from "./spinner.types";
import { WORM_SPINNER_BEHAVIOR } from "./spinner-behaviors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Спиннер кита: SVG-дуга, анимации на UI-потоке (useSpinnerAnimation).
 * `progress` 0..1 — круговой прогресс; без него — индетерминированный режим,
 * поведение которого задаётся стратегией `behavior`
 * (см. spinner-behaviors.ts: WORM_SPINNER_BEHAVIOR, CLASSIC_SPINNER_BEHAVIOR).
 */
export const Spinner: FC<ISpinnerProps> = memo(
  ({
    size = 20,
    color,
    strokeWidth,
    progress,
    behavior = WORM_SPINNER_BEHAVIOR,
    style,
  }) => {
    const { colors } = useTheme();

    const stroke = strokeWidth ?? Math.max(2, Math.round(size / 8));
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    const { containerStyle, arcProps } = useSpinnerAnimation({
      behavior,
      progress,
      circumference,
    });

    return (
      <Animated.View
        accessibilityRole={"progressbar"}
        style={[{ width: size, height: size }, containerStyle, style]}
      >
        <Svg width={size} height={size}>
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color ?? colors.primary}
            strokeWidth={stroke}
            strokeLinecap={"round"}
            fill={"none"}
            animatedProps={arcProps}
          />
        </Svg>
      </Animated.View>
    );
  },
);
