import { useFocusedScroll } from "@shared/lib/scroll";
import { ListItem, NavbarInset } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROWS = Array.from({ length: 30 }, (_, index) => index + 1);

interface ITabsDemoPageProps {
  route: { name: string };
}

/**
 * Страница вкладки: длинный список под общей скрываемой шапкой. Скролл идёт
 * в телеметрию экрана только из вкладки в фокусе.
 */
export const TabsDemoPage: FC<ITabsDemoPageProps> = memo(({ route }) => {
  const { bottom } = useSafeAreaInsets();
  const scroll = useFocusedScroll();

  return (
    <Animated.ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottom + 16 }]}
      onScroll={scroll.scrollHandler}
      scrollEventThrottle={16}
    >
      <NavbarInset />
      {ROWS.map(row => (
        <ListItem
          key={row}
          title={`${route.name} · строка ${row}`}
          subtitle={"Шапка прячется по скроллу, вкладки остаются"}
        />
      ))}
    </Animated.ScrollView>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
});
