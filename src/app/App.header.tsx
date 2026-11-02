import { StackHeaderProps } from "@react-navigation/stack";
import { useTheme } from "@shared/lib/theme";
import { Navbar, SwitchTheme } from "@shared/ui";
import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * Общий header экранов корневого стека: Navbar с кнопкой назад; по центру —
 * `options.headerTitle` (функция) или текст `title`. Справа —
 * действия экрана из `options.headerRight` (иконки без подписей), без них —
 * переключатель темы.
 */
export const AppHeader = ({ route: { name }, options }: StackHeaderProps) => {
  const { colors } = useTheme();
  const right = options.headerRight?.({ tintColor: colors.textPrimary });
  const title = options.title ?? name;
  // headerTitle-функция экрана — своё содержимое шапки (например, NavbarReveal).
  const customTitle =
    typeof options.headerTitle === "function"
      ? options.headerTitle({ children: title, tintColor: colors.textPrimary })
      : null;

  return (
    <Navbar title={title} safeArea={true}>
      <Navbar.BackButton />
      {customTitle !== null && <Navbar.Content>{customTitle}</Navbar.Content>}
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
