import type { ISearchController } from "@shared/lib/search";
import { useTheme } from "@shared/lib/theme";
import React, { FC, ReactNode, useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { searchFieldLayout } from "./search-field-layout";
import { ISearchBarProps, SearchBar } from "./SearchBar";

export interface INavbarSearchFieldProps
  extends Omit<ISearchBarProps, "search" | "cancel" | "style"> {
  search: ISearchController;
  /** Ширина кнопки поиска, от которой растёт поле, px. По умолчанию 48. */
  collapsedWidth?: number;
  /** Своё содержимое панели вместо `SearchBar` (например, со слотами). */
  children?: ReactNode;
}

/**
 * Поле поиска в навбаре (`Navbar.Overlay`): по `search.open()` панель растёт
 * от кнопки поиска у правого края на всю ширину и закрывает содержимое
 * навбара; внутри — `SearchBar` с «Отменой» (или своё содержимое), фокус
 * ставится, когда панель уже раскрывается. Анимация — на UI-потоке.
 */
export const NavbarSearchField: FC<INavbarSearchFieldProps> = ({
  search,
  collapsedWidth = 48,
  children,
  ...barProps
}) => {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const { progress, active } = search;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;

    setWidth(previous => (previous === next ? previous : next));
  }, []);

  const panelStyle = useAnimatedStyle(() => {
    const layout = searchFieldLayout(progress.value, width, collapsedWidth);

    return { width: layout.width, opacity: layout.opacity };
  }, [progress, width, collapsedWidth]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={active ? "auto" : "none"}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.panel,
          { backgroundColor: colors.background },
          panelStyle,
        ]}
      >
        {children ?? (
          <SearchBar search={search} cancel={"always"} {...barProps} />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 12,
    overflow: "hidden",
  },
});
