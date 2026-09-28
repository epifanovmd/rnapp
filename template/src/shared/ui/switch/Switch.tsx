import { useTheme } from "@shared/lib/theme";
import {
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Insets,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Spinner } from "../spinner";

export interface ISwitchProps extends Omit<PressableProps, "onPress"> {
  isActive?: boolean;
  /**
   * Синхронный или асинхронный обработчик. Если вернул Promise — до его
   * завершения в бегунке крутится спиннер, нажатия блокируются; позиция
   * остаётся за `isActive` (родитель обновляет его по факту успеха).
   */
  onChange?: (active: boolean) => void | Promise<unknown>;
  /** Внешний индикатор занятости (в дополнение к автодетекту Promise). */
  loading?: boolean;
  duration?: number;
}

const hitSlop: Insets = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Switch = memo<PropsWithChildren<ISwitchProps>>(
  ({
    isActive,
    duration = 250,
    style,
    disabled,
    loading,
    onChange,
    ...rest
  }) => {
    const position = useSharedValue(isActive ? 1 : 0);
    const { colors } = useTheme();
    const [pending, setPending] = useState(false);
    const mountedRef = useRef(true);

    const busy = pending || !!loading;

    useEffect(() => {
      mountedRef.current = true;

      return () => {
        mountedRef.current = false;
      };
    }, []);

    useEffect(() => {
      position.value = withTiming(isActive ? 1 : 0, { duration });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => {
      const translateX = interpolate(position.value, [0, 1], [0, 20]);

      const scale = interpolate(
        position.value,
        [0, 0.5, 1],
        [1, 0.9, 1],
        Extrapolation.CLAMP,
      );

      const opacity = withTiming(
        interpolate(disabled ? 1 : 0, [0, 1], [1, 0.6], Extrapolation.CLAMP),
        { duration },
      );

      return {
        backgroundColor: interpolateColor(
          position.value,
          [0, 1],
          [colors.secondary, colors.primary],
        ),
        opacity,
        transform: [
          {
            translateX,
          },
          { scale },
        ],
      };
    }, [disabled, colors, duration]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
      backgroundColor: withTiming(
        interpolateColor(
          disabled ? 0 : 1,
          [0, 1],
          [colors.textTertiary, colors.textSecondary],
        ),
      ),
    }));

    const handlePress = useCallback(() => {
      if (busy) {
        return;
      }

      const result = onChange?.(!isActive);

      // Промис → занятость до завершения (успех и ошибка равнозначно:
      // позицией владеет isActive родителя).
      if (result && typeof result.then === "function") {
        setPending(true);

        const finish = () => {
          if (mountedRef.current) {
            setPending(false);
          }
        };

        result.then(finish, finish);
      }
    }, [onChange, isActive, busy]);

    return (
      <AnimatedPressable
        accessibilityRole={"switch"}
        accessibilityState={{
          checked: !!isActive,
          disabled: !!disabled,
          busy,
        }}
        style={[SS.container, animatedContainerStyle, style]}
        onPress={handlePress}
        disabled={disabled || busy}
        hitSlop={hitSlop}
        {...rest}
      >
        <View style={[SS.content]}>
          <Animated.View style={[SS.switch, animatedStyle]}>
            {busy && <Spinner size={16} color={colors.white} />}
          </Animated.View>
        </View>
      </AnimatedPressable>
    );
  },
);

const SS = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 2,
    height: 24,
    width: 48,
  },
  content: {
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    overflow: "hidden",
  },
  switch: {
    height: "100%",
    borderRadius: 12,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
