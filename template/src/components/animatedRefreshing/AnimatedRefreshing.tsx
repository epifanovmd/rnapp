import React, {forwardRef, memo} from 'react';
import {PixelRatio} from 'react-native';
import Animated, {SharedValue, useAnimatedProps} from 'react-native-reanimated';
import {Circle, Svg, SvgProps} from 'react-native-svg';

interface AnimatedCircularProgressProps extends SvgProps {
  radius?: number;
  color?: string;
  percentage: SharedValue<number> | number;
  borderWidth?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const AnimatedRefreshing = memo(
  forwardRef<Svg, AnimatedCircularProgressProps>(
    (
      {radius = 16, color = '#ff457a', percentage, borderWidth = 4, ...rest},
      ref,
    ) => {
      const loaderRadius = PixelRatio.roundToNearestPixel(radius);
      const innerCircleRadii = loaderRadius - borderWidth / 2;
      const circumference = 2 * Math.PI * innerCircleRadii;

      const animatedProps = useAnimatedProps(() => {
        if (typeof percentage === 'number') {
          return {
            strokeDashoffset: circumference - circumference * percentage * 0.01,
          };
        }

        return {
          strokeDashoffset:
            circumference - circumference * percentage.value * 0.01,
        };
      }, [innerCircleRadii, percentage]);

      return (
        <Svg
          ref={ref}
          {...rest}
          style={[
            rest.style,
            {
              zIndex: Number.MAX_SAFE_INTEGER,
              width: 2 * radius,
              height: 2 * radius,
            },
          ]}>
          <AnimatedCircle
            cx={radius}
            cy={radius}
            fill="transparent"
            r={innerCircleRadii}
            stroke={color}
            strokeWidth={borderWidth}
            animatedProps={animatedProps}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
          />
        </Svg>
      );
    },
  ),
);
