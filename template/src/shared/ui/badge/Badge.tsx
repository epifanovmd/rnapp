import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo, PropsWithChildren } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { Text } from "../text";

export type TBadgeVariant =
  "primary" | "success" | "warning" | "danger" | "info";

export interface IBadgeProps extends ViewProps {
  /** Число в бейдже; больше max отображается как `${max}+`. */
  count?: number;
  max?: number;
  /** Точка без числа (индикатор наличия событий). */
  dot?: boolean;
  variant?: TBadgeVariant;
  /** Показывать бейдж при count = 0. */
  showZero?: boolean;
  /** С children бейдж позиционируется в правом верхнем углу контента. */
  children?: React.ReactNode;
}

const VARIANT_COLOR: Record<TBadgeVariant, keyof TColorTheme> = {
  primary: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

export const Badge: FC<PropsWithChildren<IBadgeProps>> = memo(
  ({
    count,
    max = 99,
    dot,
    variant = "danger",
    showZero,
    children,
    style,
    ...rest
  }) => {
    const { colors } = useTheme();
    const backgroundColor = colors[VARIANT_COLOR[variant]];

    const visible = dot || showZero || (count !== undefined && count > 0);
    const text =
      count !== undefined && count > max ? `${max}+` : String(count ?? "");

    const badge = visible ? (
      <View
        style={[
          dot ? styles.dot : styles.badge,
          { backgroundColor },
          !children && style,
        ]}
        {...(children ? {} : rest)}
      >
        {!dot && (
          <Text color={"white"} textStyle={"Caption_M2"}>
            {text}
          </Text>
        )}
      </View>
    ) : null;

    if (!children) {
      return badge;
    }

    return (
      <View style={[styles.anchor, style]} {...rest}>
        {children}
        {visible && <View style={styles.corner}>{badge}</View>}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  anchor: {
    alignSelf: "flex-start",
  },
  corner: {
    position: "absolute",
    top: -6,
    right: -6,
  },
});
