import { useTheme } from "@shared/lib/theme";
import { Text } from "@shared/ui";
import React, { FC } from "react";
import { StyleSheet, View } from "react-native";

export const LayoutBox: FC<{ label: string; flex?: number }> = ({
  label,
  flex,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.box, { backgroundColor: colors.onSurface, flex }]}>
      <Text textStyle={"Caption_M3"}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
});
