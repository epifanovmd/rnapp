import { readAnimatedNumber, TAnimatedNumber } from "@shared/lib/animation";
import { useTheme } from "@shared/lib/theme";
import React, { FC, PropsWithChildren, useEffect, useState } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export interface ISearchOverlayProps {
  /** Показан ли оверлей (решает экран: режим поиска, пустой запрос…). */
  visible: boolean;
  /** Отступ сверху — под шапкой/строкой поиска (`useNavbarVisibleHeight()`). */
  top?: TAnimatedNumber;
  /** Длительность появления и скрытия, мс. По умолчанию 200. */
  duration?: number;
  /** Монтировать содержимое только при первом показе. По умолчанию `true`. */
  lazy?: boolean;
  /** Размонтировать содержимое после скрытия (освободить память). По умолчанию `false`. */
  unmountOnHide?: boolean;
  /** Фон. По умолчанию — фон экрана. */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Панель режима поиска поверх контента экрана: проявляется и гаснет на
 * UI-потоке, касания — только пока показана. Содержимое монтируется лениво
 * и (по `unmountOnHide`) снимается после скрытия — пока поиск не открыт,
 * экран за неё не платит.
 */
export const SearchOverlay: FC<PropsWithChildren<ISearchOverlayProps>> = ({
  visible,
  top = 0,
  duration = 200,
  lazy = true,
  unmountOnHide = false,
  backgroundColor,
  style,
  children,
}) => {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(visible || !lazy);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) setMounted(true);

    progress.value = withTiming(visible ? 1 : 0, { duration }, finished => {
      if (finished && !visible && unmountOnHide) {
        scheduleOnRN(setMounted, false);
      }
    });
  }, [visible, duration, unmountOnHide, progress]);

  const animatedStyle = useAnimatedStyle(
    () => ({ opacity: progress.value, top: readAnimatedNumber(top) }),
    [progress, top],
  );

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlay,
        { backgroundColor: backgroundColor ?? colors.background },
        style,
        animatedStyle,
      ]}
    >
      {mounted ? children : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
