import React, { FC, ReactNode, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SharedValue } from "react-native-reanimated";

import { RevealView, TRevealPreset } from "../reveal";
import { Touchable } from "../touchable";
import { NavbarSubTitle } from "./NavbarSubTitle";
import { NavbarTitle } from "./NavbarTitle";

/** С какого прогресса шапка реагирует на тап (содержимое уже заметно). */
const PRESS_THRESHOLD = 0.5;

/**
 * Насколько обычный заголовок может выходить за ширину компактного: оба
 * лежат друг на друге, ширину блоку задаёт компактный.
 */
const FALLBACK_OVERFLOW = 120;

export interface INavbarRevealProps {
  /** Прогресс появления (`useScrollReveal().progress`). */
  progress: SharedValue<number> | Readonly<SharedValue<number>>;
  /** Компактный заголовок, появляющийся в шапке. */
  title?: string;
  subtitle?: string;
  /** Своё содержимое вместо `title`/`subtitle`. */
  children?: ReactNode;
  /** Заголовок до появления — уходит, пока появляется компактный. */
  fallbackTitle?: string;
  /** Тап по появившемуся содержимому (например, `reveal.scrollToTop`). */
  onPress?: () => void;
  /** Как появляться. По умолчанию `"slide-up"`. */
  preset?: TRevealPreset;
  /** Сдвиг для slide, px. По умолчанию 10. */
  distance?: number;
}

/**
 * Содержимое шапки, появляющееся по прогрессу скролла: компактный заголовок
 * экрана выезжает снизу, когда его «большая» версия уходит под шапку. Обычный
 * заголовок (`fallbackTitle`) в это время гаснет. Всё — на UI-потоке.
 */
export const NavbarReveal: FC<INavbarRevealProps> = ({
  progress,
  title,
  subtitle,
  children,
  fallbackTitle,
  onPress,
  preset = "slide-up",
  distance = 10,
}) => {
  const handlePress = useCallback(() => {
    if (progress.value >= PRESS_THRESHOLD) onPress?.();
  }, [progress, onPress]);

  return (
    <Touchable
      onPress={handlePress}
      disabled={!onPress}
      alignItems={"center"}
      justifyContent={"center"}
      accessibilityRole={onPress ? "button" : undefined}
    >
      {!!fallbackTitle && (
        <RevealView
          progress={progress}
          preset={"fade"}
          inverse
          range={[0, 0.5]}
          style={styles.fallback}
          pointerEvents={"none"}
        >
          <NavbarTitle>{fallbackTitle}</NavbarTitle>
        </RevealView>
      )}
      <RevealView
        progress={progress}
        preset={preset}
        distance={distance}
        style={styles.content}
      >
        {children ?? (
          <>
            {!!title && <NavbarTitle>{title}</NavbarTitle>}
            {!!subtitle && (
              <NavbarSubTitle color={"textSecondary"}>{subtitle}</NavbarSubTitle>
            )}
          </>
        )}
      </RevealView>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  fallback: {
    position: "absolute",
    top: 0,
    right: -FALLBACK_OVERFLOW,
    bottom: 0,
    left: -FALLBACK_OVERFLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
});
