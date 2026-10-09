import { Platform, StyleSheet } from "react-native";

/** Моноширинный текст: версии, ключи, журнал. */
export const monoStyles = StyleSheet.create({
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
