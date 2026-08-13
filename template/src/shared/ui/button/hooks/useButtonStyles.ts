import { TColorTheme, useTheme } from "@shared/lib/theme";
import { useMemo } from "react";
import { Insets, StyleSheet, ViewStyle } from "react-native";

import { TButtonAppearance, TButtonSize, TButtonVariant } from "../types";

interface IVariantPalette {
  /** Фон filled-исполнения. */
  background: keyof TColorTheme;
  /** Рамка outline-исполнения. */
  border: keyof TColorTheme;
  /** Контент outline/ghost (может отличаться от border ради читаемости). */
  content: keyof TColorTheme;
  /** Контент поверх filled-фона. */
  foreground: keyof TColorTheme;
}

/** Новый вариант кнопки — одна строка здесь. */
const VARIANT_PALETTE: Record<TButtonVariant, IVariantPalette> = {
  primary: {
    background: "primary",
    border: "primary",
    content: "primary",
    foreground: "primaryForeground",
  },
  secondary: {
    background: "secondary",
    border: "secondary",
    content: "textSecondary",
    foreground: "secondaryForeground",
  },
  danger: {
    background: "danger",
    border: "danger",
    content: "danger",
    foreground: "dangerForeground",
  },
};

const GHOST_HIT_SLOP: Insets = { left: 8, right: 8, top: 8, bottom: 8 };

export interface IButtonStyles {
  styles: ViewStyle;
  /** Ключ цвета контента (для Text). */
  contentColorKey: keyof TColorTheme;
  /** Резолвленный цвет контента (для Icon/Spinner). */
  contentColor: string;
  hitSlop?: Insets;
}

/**
 * Стили кнопки: вариант и исполнение ортогональны, палитра — единый record.
 * Disabled — токенами (нейтральный фон/рамка + textDisabled): opacity в
 * style бесполезен — TouchableOpacity владеет прозрачностью контейнера.
 */
export const useButtonStyles = (
  variant: TButtonVariant,
  appearance: TButtonAppearance,
  size: TButtonSize = "medium",
  disabled: boolean = false,
  customColor?: keyof TColorTheme,
): IButtonStyles => {
  const { colors } = useTheme();

  return useMemo(() => {
    const palette = VARIANT_PALETTE[variant];
    const isGhost = appearance === "ghost";

    const contentColorKey = disabled
      ? "textDisabled"
      : (customColor ??
        (appearance === "filled" ? palette.foreground : palette.content));

    const appearanceStyle: ViewStyle =
      appearance === "filled"
        ? {
            backgroundColor: disabled
              ? colors.onSurface
              : colors[palette.background],
          }
        : appearance === "outline"
          ? {
              borderWidth: 1,
              borderColor: disabled
                ? colors.border
                : colors[customColor ?? palette.border],
            }
          : {};

    return {
      styles: {
        ...BUTTON_STYLES.base,
        ...(isGhost ? BUTTON_STYLES.ghostSize : BUTTON_STYLES[size]),
        ...appearanceStyle,
      },
      contentColorKey,
      contentColor: colors[contentColorKey],
      hitSlop: isGhost ? GHOST_HIT_SLOP : undefined,
    };
  }, [variant, appearance, size, disabled, customColor, colors]);
};

const BUTTON_STYLES = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 6,
  },
  medium: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 48 },
  small: { paddingHorizontal: 12, paddingVertical: 4, minHeight: 40 },
  ghostSize: { paddingHorizontal: 4 },
});
