import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo, PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { FlexProps, Row, useFlexProps } from "../flex-view";
import { Text } from "../text";

export type TTagVariant =
  | "default"
  | "primary"
  | "secondary"
  | "destructive"
  | "purple"
  | "success"
  | "warning"
  | "info"
  | "outline"
  | "muted";

export interface ITagProps extends FlexProps {
  variant?: TTagVariant | null;
  /** Точка-индикатор перед текстом. */
  dot?: boolean;
  /** Иконка перед текстом. */
  icon?: ReactNode;
}

interface ITone {
  fg: keyof TColorTheme;
  bg: keyof TColorTheme | string;
}

const PURPLE = "#8B5CF6";

const TONES: Record<TTagVariant, ITone> = {
  default: { fg: "textPrimary", bg: "onSurface" },
  primary: { fg: "white", bg: "primary" },
  secondary: { fg: "textPrimary", bg: "onSurface" },
  destructive: { fg: "danger", bg: "danger" },
  purple: { fg: "textPrimary", bg: PURPLE },
  success: { fg: "success", bg: "success" },
  warning: { fg: "warning", bg: "warning" },
  info: { fg: "info", bg: "info" },
  outline: { fg: "textPrimary", bg: "transparent" },
  muted: { fg: "textSecondary", bg: "onSurface" },
};

/** Мягкая заливка: акцентные варианты — цвет с прозрачностью. */
const SOFT: ReadonlySet<TTagVariant> = new Set([
  "destructive",
  "purple",
  "success",
  "warning",
  "info",
]);

/** Метка-«пилюля» статуса или категории: `<Tag variant="success" dot>Online</Tag>`. */
export const Tag: FC<PropsWithChildren<ITagProps>> = memo(
  ({ variant, dot, icon, children, ...rest }) => {
    const { colors } = useTheme();
    const { style } = useFlexProps(rest);
    const tone = TONES[variant ?? "default"];
    const base =
      tone.bg in colors ? colors[tone.bg as keyof TColorTheme] : tone.bg;
    const fg = colors[tone.fg];
    const backgroundColor = SOFT.has(variant ?? "default")
      ? `${String(base)}26`
      : base;

    return (
      <Row
        style={[
          styles.tag,
          { backgroundColor },
          variant === "outline" && { borderColor: colors.border },
          variant === "outline" && styles.outline,
          style,
        ]}
      >
        {dot && <View style={[styles.dot, { backgroundColor: fg }]} />}
        {icon}
        {typeof children === "string" || typeof children === "number" ? (
          <Text textStyle={"Caption_M2"} color={tone.fg} numberOfLines={1}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Row>
    );
  },
);

const styles = StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    minHeight: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
  },
  outline: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
