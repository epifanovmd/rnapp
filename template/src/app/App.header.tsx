import { StackHeaderProps } from "@react-navigation/stack";
import { Navbar, SwitchTheme } from "@shared/ui";
import React from "react";
import { StyleSheet, View } from "react-native";

/** Общий header экранов корневого стека: Navbar с кнопкой назад и переключателем темы. */
export const AppHeader = ({ route: { name }, options }: StackHeaderProps) => (
  <Navbar title={options.title ?? name} safeArea={true}>
    <Navbar.BackButton />
    <Navbar.Right>
      <View style={styles.actions}>
        <SwitchTheme marginLeft={"auto"} />
      </View>
    </Navbar.Right>
  </Navbar>
);

const styles = StyleSheet.create({
  actions: {
    margin: 12,
  },
});
