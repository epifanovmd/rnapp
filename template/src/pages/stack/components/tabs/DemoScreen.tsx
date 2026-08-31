import { useScroll } from "@shared/lib/scroll";
import { useNavbarHeight } from "@shared/ui";
import React, { FC, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Скролл-обёртка демо-таба: телеметрия для HiddenBar + отступы под бары. */
export const DemoScreen: FC<PropsWithChildren> = ({ children }) => {
  const { bottom } = useSafeAreaInsets();
  const navbarHeight = useNavbarHeight();
  const scroll = useScroll();

  return (
    <Animated.ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottom + 16, paddingTop: navbarHeight + 8 },
      ]}
      onScroll={scroll?.scrollHandler}
      scrollEventThrottle={16}
    >
      {children}
    </Animated.ScrollView>
  );
};

export type { IDemoSectionProps } from "./DemoSection";
export { DemoSection } from "./DemoSection";

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 24,
  },
});
