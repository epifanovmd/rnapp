import React, { FC, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Скролл-обёртка демо-экрана: отступы контента и safe area снизу. */
export const DemoScreen: FC<PropsWithChildren> = ({ children }) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <Animated.ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottom + 16 },
      ]}
      keyboardShouldPersistTaps={"handled"}
    >
      {children}
    </Animated.ScrollView>
  );
};

export type { IDemoSectionProps } from "./DemoSection";
export { DemoSection } from "./DemoSection";

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 24,
  },
});
