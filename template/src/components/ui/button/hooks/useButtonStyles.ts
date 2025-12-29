import { TColorTheme, useTheme } from "@core";
import { useMemo } from "react";
import { ColorValue, StyleSheet, ViewStyle } from "react-native";

import { TButtonSize, TButtonType } from "../types";

const COLOR_MAP: Record<TButtonType, keyof TColorTheme> = {
  primaryFilled: "buttonPrimaryText",
  primaryOutline: "buttonPrimaryBackground",
  secondaryFilled: "buttonSecondaryText",
  secondaryOutline: "buttonSecondaryText",
  dangerFilled: "buttonDangerText",
  dangerOutline: "buttonDangerBackground",
  text: "blue500",
};

const COLOR_MAP_DISABLED: Record<TButtonType, keyof TColorTheme> = {
  primaryFilled: "buttonPrimaryDisabledText",
  primaryOutline: "buttonPrimaryDisabledBackground",
  secondaryFilled: "buttonSecondaryDisabledText",
  secondaryOutline: "buttonSecondaryDisabledBackground",
  dangerFilled: "buttonDangerDisabledText",
  dangerOutline: "buttonDangerDisabledBackground",
  text: "blue500",
};

export const useButtonStyles = (
  type: TButtonType,
  size: TButtonSize = "medium",
  disabled: boolean = false,
  customColor?: keyof TColorTheme,
) => {
  const { colors } = useTheme();

  return useMemo(() => {
    const colorMap = disabled ? COLOR_MAP_DISABLED : COLOR_MAP;
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
      color: customColor ?? colorMap[type],
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
  const baseColors = {
    primary: disabled
      ? colors.buttonPrimaryDisabledBackground
      : colors.buttonPrimaryBackground,
    secondary: disabled
      ? colors.buttonSecondaryDisabledBackground
      : colors.buttonSecondaryBackground,
    danger: disabled
      ? colors.buttonDangerDisabledBackground
      : colors.buttonDangerBackground,
  };

  const styles: Record<TButtonType, ViewStyle> = {
    primaryFilled: { backgroundColor: baseColors.primary },
    primaryOutline: {
      borderWidth: 1,
      borderColor: customColor ?? baseColors.primary,
    },
    secondaryFilled: { backgroundColor: baseColors.secondary },
    secondaryOutline: {
      borderWidth: 1,
      borderColor: customColor ?? baseColors.secondary,
    },
    dangerFilled: { backgroundColor: baseColors.danger },
    dangerOutline: {
      borderWidth: 1,
      borderColor: customColor ?? baseColors.danger,
    },
    text: {},
  };

  return styles[type];
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
