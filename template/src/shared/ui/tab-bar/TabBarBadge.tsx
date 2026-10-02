import { useTheme } from "@shared/lib/theme";
import React, { FC } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../text";

interface ITabBarBadgeProps {
  /** Число/строка — счётчик, `true` — точка. */
  value: number | string | boolean;
}

/** Бейдж на иконке вкладки: счётчик или точка. */
export const TabBarBadge: FC<ITabBarBadgeProps> = ({ value }) => {
  const { colors } = useTheme();

  if (value === false || value === "" || value === 0) return null;

  if (value === true) {
    return (
      <View
        style={[
          styles.dot,
          { backgroundColor: colors.danger, borderColor: colors.surface },
        ]}
      />
    );
  }

  const text =
    typeof value === "number" && value > 99 ? "99+" : String(value);

  return (
    <View
      style={[
        styles.counter,
        { backgroundColor: colors.danger, borderColor: colors.surface },
      ]}
    >
      <Text textStyle={"Caption_M1"} color={"white"} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    top: -2,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  counter: {
    position: "absolute",
    top: -6,
    left: "60%",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});
