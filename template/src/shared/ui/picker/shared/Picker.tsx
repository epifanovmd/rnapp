import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, {
  Children,
  isValidElement,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { ColorValue, StyleSheet, View } from "react-native";

import type { PickerColumnProps } from "./PickerColumn";
import { PickerWheel } from "./PickerWheel";
import type { PickerColor, PickerProps } from "./types";

type PickerChild = ReactElement<PickerColumnProps>;

export interface PickerRootProps extends PickerProps {
  children: PickerChild | PickerChild[];
}

const DEFAULTS = {
  itemHeight: 44,
  visibleItemCount: 5,
  itemSpacing: 0,
  fontSize: 20,
  selectedFontSize: 20,
  fontWeight: "normal",
  selectedFontWeight: "normal",
  textAlign: "center",
  numberOfLines: 1,
  itemPaddingHorizontal: 8,
  curvature: 1,
  edgeOpacity: 0.25,
  edgeScale: 0.8,
  haptics: true,
  indicatorStyle: "fill",
  indicatorRadius: 8,
  indicatorSize: 1,
  // Отступ по краям колонки: полосы соседних колонок не смыкаются.
  indicatorInset: 4,
} as const;

/** Полоса выбора как у системного колеса: полупрозрачная заливка. */
const INDICATOR_FILL = {
  light: "rgba(120, 120, 128, 0.12)",
  dark: "rgba(120, 120, 128, 0.24)",
} as const;

const isThemeColor = (
  color: PickerColor,
  colors: TColorTheme,
): color is keyof TColorTheme =>
  typeof color === "string" && color in (colors as object);

const asChildren = <T,>(nodes: ReactNode): ReactElement<T>[] =>
  Children.toArray(nodes).filter(isValidElement) as ReactElement<T>[];

/**
 * Колесо выбора: одна колонка — один нативный вью. Оформление задаётся на
 * пикере целиком и точечно перекрывается на колонке.
 */
export const Picker = memo(
  ({
    children,
    style,
    testID,
    onChange,
    onScrollStateChange,
    onScroll,
    onItemPress,
    ...appearance
  }: PickerRootProps) => {
    const { colors, isDark } = useTheme();

    const resolveColor = useCallback(
      (color?: PickerColor): ColorValue | undefined =>
        color === undefined
          ? undefined
          : isThemeColor(color, colors)
            ? colors[color]
            : color,
      [colors],
    );

    const columns = useMemo(
      () => asChildren<PickerColumnProps>(children),
      [children],
    );

    const height =
      (appearance.itemHeight ?? DEFAULTS.itemHeight) *
      (appearance.visibleItemCount ?? DEFAULTS.visibleItemCount);

    return (
      <View style={[styles.row, { height }, style]} testID={testID}>
        {columns.map((column, columnIndex) => (
          <PickerWheel
            key={column.key ?? columnIndex}
            column={column.props}
            columnIndex={columnIndex}
            appearance={appearance}
            resolveColor={resolveColor}
            defaultItemColor={colors.textPrimary}
            defaultDisabledColor={colors.textDisabled}
            defaultIndicatorColor={
              isDark ? INDICATOR_FILL.dark : INDICATOR_FILL.light
            }
            onChange={onChange}
            onScrollStateChange={onScrollStateChange}
            onScroll={onScroll}
            onItemPress={onItemPress}
          />
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
});
