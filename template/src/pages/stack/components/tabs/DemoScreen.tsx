import { useScroll } from "@shared/lib/scroll";
import { useTransition } from "@shared/lib/transition";
import { Col, Text } from "@shared/ui";
import React, { FC, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Скролл-обёртка демо-таба: телеметрия для HiddenBar + отступы под бары. */
export const DemoScreen: FC<PropsWithChildren> = ({ children }) => {
  const { bottom } = useSafeAreaInsets();
  const { navbar } = useTransition();
  const scroll = useScroll();

  return (
    <Animated.ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottom + 16, paddingTop: navbar.height + 8 },
      ]}
      onScroll={scroll?.scrollHandler}
      scrollEventThrottle={16}
    >
      {children}
    </Animated.ScrollView>
  );
};

export interface IDemoSectionProps {
  title: string;
  description?: string;
  /** Расстояние между примерами секции. */
  gap?: number;
}

/** Секция демо: заголовок, опциональное описание, контент. */
export const DemoSection: FC<PropsWithChildren<IDemoSectionProps>> = ({
  title,
  description,
  gap = 12,
  children,
}) => (
  <Col gap={gap}>
    <Col gap={2}>
      <Text textStyle={"Title_S1"}>{title}</Text>
      {!!description && (
        <Text color={"textSecondary"} textStyle={"Caption_M3"}>
          {description}
        </Text>
      )}
    </Col>
    {children}
  </Col>
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 24,
  },
});
