import { TColorTheme, useTheme } from "@shared/lib/theme";
import { useMemo } from "react";
import { ColorValue, StyleSheet, ViewStyle } from "react-native";

import { TButtonSize, TButtonType } from "../types";

const COLOR_MAP: Record<TButtonType, keyof TColorTheme> = {
  primaryFilled: "primaryForeground",
  primaryOutline: "primary",
  secondaryFilled: "secondaryForeground",
  secondaryOutline: "secondaryForeground",
  dangerFilled: "dangerForeground",
  dangerOutline: "danger",
  text: "primary",
};

export const useButtonStyles = (
  type: TButtonType,
  size: TButtonSize = "medium",
  disabled: boolean = false,
  customColor?: keyof TColorTheme,
) => {
  const { colors } = useTheme();

  return useMemo(() => {
    const isTextType = type === "text";
    const sizeStyle = isTextType ? BUTTON_STYLES.textSize : BUTTON_STYLES[size];
    const hitSlop = { left: 8, right: 8, top: 8, bottom: 8 };

    const variantStyle = getVariantStyle(colors, disabled, type, customColor);

    return {
      colors,
      styles: {
        ...BUTTON_STYLES.base,
        ...sizeStyle,
        ...variantStyle,
      },
      color: customColor ?? COLOR_MAP[type],
      hitSlop: isTextType ? hitSlop : undefined,
    };
  }, [disabled, type, size, colors, customColor]);
};

const getVariantStyle = (
  colors: TColorTheme,
  disabled: boolean,
  type: TButtonType,
  customColor?: ColorValue,
): ViewStyle => {
  const styles: Record<TButtonType, ViewStyle> = {
    primaryFilled: { backgroundColor: colors.primary },
    primaryOutline: {
      borderWidth: 1,
      borderColor: customColor ?? colors.primary,
    },
    secondaryFilled: { backgroundColor: colors.secondary },
    secondaryOutline: {
      borderWidth: 1,
      borderColor: customColor ?? colors.secondary,
    },
    dangerFilled: { backgroundColor: colors.danger },
    dangerOutline: {
      borderWidth: 1,
      borderColor: customColor ?? colors.danger,
    },
    text: {},
  };

  return { ...styles[type], opacity: disabled ? 0.4 : 1 };
};

const BUTTON_STYLES = StyleSheet.create({
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 4,
  },
  medium: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 48 },
  small: { paddingHorizontal: 12, paddingVertical: 4, minHeight: 40 },
  textSize: { paddingHorizontal: 4 },
});
