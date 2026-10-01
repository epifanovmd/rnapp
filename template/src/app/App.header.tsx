import { StackHeaderProps } from "@react-navigation/stack";
import { useTheme } from "@shared/lib/theme";
import { Navbar, SwitchTheme } from "@shared/ui";
import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * Общий header экранов корневого стека: Navbar с кнопкой назад. Справа —
 * действия экрана из `options.headerRight` (иконки без подписей), без них —
 * переключатель темы.
 */
export const AppHeader = ({ route: { name }, options }: StackHeaderProps) => {
  const { colors } = useTheme();
  const right = options.headerRight?.({ tintColor: colors.textPrimary });

  return (
    <Navbar title={options.title ?? name} safeArea={true}>
      <Navbar.BackButton />
      <Navbar.Right>
        <View style={styles.actions}>
          {right ?? <SwitchTheme marginLeft={"auto"} />}
        </View>
      </Navbar.Right>
    </Navbar>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    margin: 12,
  },
});
