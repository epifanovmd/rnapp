import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { Text } from "../text";

export interface IDividerProps extends ViewProps {
  /** Вертикальный разделитель (для Row-раскладок). */
  vertical?: boolean;
  thickness?: number;
  /** Отступ от краёв вдоль оси разделителя. */
  inset?: number;
  color?: keyof TColorTheme;
  /** Подпись по центру (только горизонтальный). */
  label?: string;
}

export const Divider: FC<IDividerProps> = memo(
  ({
    vertical,
    thickness = StyleSheet.hairlineWidth,
    inset = 0,
    color = "border",
    label,
    style,
    ...rest
  }) => {
    const { colors } = useTheme();
    const lineColor = colors[color];

    if (vertical) {
      return (
        <View
          style={[
            styles.vertical,
            {
              width: thickness,
              backgroundColor: lineColor,
              marginVertical: inset,
            },
            style,
          ]}
          {...rest}
        />
      );
    }

    if (label) {
      return (
        <View
          style={[styles.labeled, { marginHorizontal: inset }, style]}
          {...rest}
        >
          <View
            style={[
              styles.line,
              { height: thickness, backgroundColor: lineColor },
            ]}
          />
          <Text color={"textSecondary"} textStyle={"Caption_M3"}>
            {label}
          </Text>
          <View
            style={[
              styles.line,
              { height: thickness, backgroundColor: lineColor },
            ]}
          />
        </View>
      );
    }

    return (
      <View
        style={[
          {
            height: thickness,
            backgroundColor: lineColor,
            marginHorizontal: inset,
          },
          style,
        ]}
        {...rest}
      />
    );
  },
);

const styles = StyleSheet.create({
  vertical: {
    alignSelf: "stretch",
  },
  labeled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  line: {
    flex: 1,
  },
});
