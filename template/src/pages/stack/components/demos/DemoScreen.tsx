import {
  KeyboardAwareContent,
  useKeyboardAwareScroll,
} from "@shared/lib/keyboard-aware";
import React, { FC, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Скролл-обёртка демо-экрана: отступы контента, safe area снизу и поля
 * над клавиатурой (`useKeyboardAwareScroll`).
 */
export const DemoScreen: FC<PropsWithChildren> = ({ children }) => {
  const { bottom } = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const keyboardAware = useKeyboardAwareScroll(scrollRef);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps={"handled"}
    >
      <KeyboardAwareContent controller={keyboardAware}>
        <View style={[styles.body, { paddingBottom: bottom + 16 }]}>
          {children}
        </View>
      </KeyboardAwareContent>
    </Animated.ScrollView>
  );
};

export type { IDemoSectionProps } from "./DemoSection";
export { DemoSection } from "./DemoSection";

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  body: {
    gap: 24,
  },
});
