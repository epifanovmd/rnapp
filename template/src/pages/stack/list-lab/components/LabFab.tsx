import { useTheme } from "@shared/lib/theme";
import { Icon } from "@shared/ui";
import React, { FC, memo, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const SIZE = 40;
/** Зазор между кнопкой и верхней кромкой панели ввода. */
const GAP = 12;
const FADE_MS = 250;

/** Палитра кнопки: та же, что у кнопки возврата в чате. */
const PALETTE = {
  light: {
    background: "#FFFFFF",
    border: "rgb(204, 204, 204)",
    arrow: "rgb(64, 140, 230)",
    shadow: "rgba(51, 102, 179, 0.3)",
  },
  dark: {
    background: "rgb(38, 48, 64)",
    border: "rgb(64, 64, 64)",
    arrow: "rgb(115, 179, 255)",
    shadow: "rgba(0, 0, 0, 0.4)",
  },
};

interface ILabFabProps {
  /**
   * Нижний отступ контента: перекрытие снизу плюс панель ввода. Тот же, что
   * отдан списку, — иначе кнопка и контент кончаются на разных линиях.
   */
  bottomInset: SharedValue<number>;
  /** Список у нижнего края — тогда кнопка не нужна. */
  isAtEnd: SharedValue<boolean>;
  onPress: () => void;
}

/**
 * Кнопка возврата к концу списка.
 *
 * Позиция и видимость считаются на UI-потоке: отступ берётся тот же, что
 * получает контент, поэтому кнопка едет вместе с клавиатурой в один кадр с ней,
 * а не догоняет её через рендер. Через React не проходит ничего.
 *
 * Двигается трансформом, а не `bottom`: тот пересчитывал бы раскладку на каждом
 * кадре анимации.
 */
export const LabFab: FC<ILabFabProps> = memo(
  ({ bottomInset, isAtEnd, onPress }) => {
    const { isDark } = useTheme();
    const palette = isDark ? PALETTE.dark : PALETTE.light;

    const containerStyle = useAnimatedStyle(() => ({
      opacity: withTiming(isAtEnd.value ? 0 : 1, { duration: FADE_MS }),
      transform: [{ translateY: -(bottomInset.value + GAP) }],
      // Видимость считается на UI-потоке, поэтому pointerEvents задаётся
      // стилем, а не пропом — React не должен перехватывать тапы скрытой кнопки.
      pointerEvents: isAtEnd.value ? "none" : "auto",
    }));

    const buttonStyle = useMemo(
      () => [
        ss.button,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
      ],
      [palette],
    );

    return (
      <Animated.View style={[ss.container, containerStyle]}>
        <Pressable style={buttonStyle} onPress={onPress}>
          <Icon
            name={"chevronDown"}
            size={18}
            color={palette.arrow}
            strokeWidth={2.6}
          />
        </Pressable>
      </Animated.View>
    );
  },
);

LabFab.displayName = "LabFab";

const ss = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: SIZE / 2,
    borderWidth: 0.5,
    elevation: 4,
    height: SIZE,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    width: SIZE,
  },
  container: { bottom: 0, position: "absolute", right: 12, width: SIZE },
});
