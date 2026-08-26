import { useTheme } from "@shared/lib/theme";
import { Text } from "@shared/ui";
import React, { FC, memo } from "react";
import { Pressable, StyleSheet } from "react-native";

interface ILabActionProps {
  title: string;
  onPress: () => void;
}

/** Кнопка действия стенда. */
export const LabAction: FC<ILabActionProps> = memo(({ title, onPress }) => {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[ss.action, isDark ? ss.actionDark : ss.actionLight]}
    >
      <Text textStyle={"Caption_M2"}>{title}</Text>
    </Pressable>
  );
});

LabAction.displayName = "LabAction";

const ss = StyleSheet.create({
  action: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionDark: { backgroundColor: "#3A4048" },
  actionLight: { backgroundColor: "#DDE3EA" },
});
