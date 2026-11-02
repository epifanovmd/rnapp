import type { ISearchBarSync } from "@shared/lib/search";
import React, { FC, PropsWithChildren } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

export interface ISearchShiftViewProps {
  sync: ISearchBarSync;
  style?: StyleProp<ViewStyle>;
}

/**
 * Контейнер контента под скрываемой шапкой с поиском: поднимается вслед за
 * шапкой трансформом — в одном кадре с ней, без перераскладки списка.
 * Продлён вниз на ход шапки, чтобы снизу не открывалась полоса; в конец
 * прокручиваемого содержимого — `SearchShiftSpacer` той же высоты.
 */
export const SearchShiftView: FC<PropsWithChildren<ISearchShiftViewProps>> = ({
  sync,
  style,
  children,
}) => {
  const { contentShift, shiftRange } = sync;

  // Продление — layout, меняется только при перемере шапки.
  const extentStyle = useAnimatedStyle(
    () => ({ marginBottom: -shiftRange.value }),
    [shiftRange],
  );
  const shiftStyle = useAnimatedStyle(
    () => ({ transform: [{ translateY: -contentShift.value }] }),
    [contentShift],
  );

  return (
    <Animated.View style={[styles.fill, extentStyle]}>
      <Animated.View style={[styles.fill, style, shiftStyle]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
