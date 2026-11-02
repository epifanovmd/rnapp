import { useScrollTelemetry } from "@shared/lib/scroll";
import {
  Container,
  HiddenBar,
  ListItem,
  Navbar,
  NavbarInset,
  useNavbarScrollSync,
} from "@shared/ui";
import React, { FC, ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface INavbarHiddenContentProps {
  title: string;
  /** Скрываемая часть шапки под навбаром (карточка и т.п.). */
  header?: ReactNode;
  /** Закреплённая часть — не прячется. */
  sticky?: ReactNode;
  /** Над списком, под отступом шапки. */
  top?: ReactNode;
  rows: number[];
}

/** Скрываемая шапка над списком: шапка следует за скроллом через телеметрию экрана. */
export const NavbarHiddenContent: FC<INavbarHiddenContentProps> = ({
  title,
  header,
  sticky,
  top,
  rows,
}) => {
  const { bottom } = useSafeAreaInsets();
  const telemetry = useScrollTelemetry();

  useNavbarScrollSync(telemetry);

  return (
    <Container edges={[]}>
      <HiddenBar safeArea bottomRadius={sticky ? 20 : undefined}>
        <Navbar title={title}>
          <Navbar.BackButton />
        </Navbar>
        {header}
        {!!sticky && (
          <HiddenBar.StickyContent>{sticky}</HiddenBar.StickyContent>
        )}
      </HiddenBar>

      <Animated.ScrollView
        onScroll={telemetry.scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 16 }]}
      >
        <NavbarInset />
        {top}
        {rows.map(row => (
          <ListItem
            key={row}
            title={`Строка ${row}`}
            subtitle={"Шапка следует за скроллом"}
          />
        ))}
      </Animated.ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
});
