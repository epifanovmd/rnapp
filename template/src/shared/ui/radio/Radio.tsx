import { useTheme } from "@shared/lib/theme";
import React, { memo, useCallback, useEffect } from "react";
import {
  Insets,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Col, Row } from "../flex-view";
import { Text } from "../text";

export interface IRadioProps extends Omit<PressableProps, "onPress"> {
  isActive?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  duration?: number;
}

const hitSlop: Insets = { top: 8, right: 8, bottom: 8, left: 8 };

const DOT_SIZE = 22;

/** Одиночная радио-кнопка; для группы — RadioGroup. */
export const Radio = memo<IRadioProps>(
  ({
    isActive = false,
    onChange,
    disabled,
    label,
    description,
    duration = 200,
    style,
    ...rest
  }) => {
    const { colors } = useTheme();
    const active = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
      active.value = withTiming(isActive ? 1 : 0, { duration });
    }, [isActive, active, duration]);

    const handlePress = useCallback(() => {
      if (!isActive) {
        onChange?.(true);
      }
    }, [isActive, onChange]);

    const ringStyle = useAnimatedStyle(() => ({
      borderColor: interpolateColor(
        active.value,
        [0, 1],
        [colors.textTertiary, colors.primary],
      ),
      opacity: withTiming(disabled ? 0.5 : 1, { duration }),
    }));

    const dotStyle = useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(active.value, [0, 1], [0, 1]) }],
      opacity: active.value,
      backgroundColor: colors.primary,
    }));

    return (
      <Pressable
        accessibilityRole={"radio"}
        accessibilityState={{ checked: isActive, disabled: !!disabled }}
        disabled={disabled}
        hitSlop={hitSlop}
        onPress={handlePress}
        style={style as PressableProps["style"]}
        {...rest}
      >
        <Row alignItems={"center"} gap={10}>
          <Animated.View style={[styles.ring, ringStyle]}>
            <Animated.View style={[styles.dot, dotStyle]} />
          </Animated.View>
          {(!!label || !!description) && (
            <Col flexShrink={1}>
              {!!label && <Text>{label}</Text>}
              {!!description && (
                <Text color={"textSecondary"} textStyle={"Caption_M3"}>
                  {description}
                </Text>
              )}
            </Col>
          )}
        </Row>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  ring: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: DOT_SIZE / 2,
    height: DOT_SIZE / 2,
    borderRadius: DOT_SIZE / 4,
  },
});
