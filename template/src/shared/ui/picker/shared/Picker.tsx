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

import NativeWheelPicker, {
  NativeWheelPickerItem,
} from "../native/NativeWheelPickerSpec";
import type { PickerColumnProps } from "./PickerColumn";
import type { PickerItemProps } from "./PickerItem";
import type {
  PickerAppearance,
  PickerColor,
  PickerItemValue,
  PickerProps,
  PickerScrollState,
} from "./types";

type PickerChild = ReactElement<PickerColumnProps>;

export interface PickerRootProps extends PickerProps {
  children: PickerChild | PickerChild[];
}

const SCROLL_STATES: PickerScrollState[] = ["idle", "dragging", "settling"];

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

interface PickerWheelProps extends Pick<
  PickerProps,
  "onChange" | "onScrollStateChange" | "onScroll" | "onItemPress"
> {
  appearance: PickerAppearance;
  column: PickerColumnProps;
  columnIndex: number;
  defaultDisabledColor: ColorValue;
  defaultIndicatorColor: ColorValue;
  defaultItemColor: ColorValue;
  resolveColor: (color?: PickerColor) => ColorValue | undefined;
}

const PickerWheel = memo(
  ({
    appearance,
    column,
    columnIndex,
    defaultDisabledColor,
    defaultIndicatorColor,
    defaultItemColor,
    resolveColor,
    onChange,
    onScrollStateChange,
    onScroll,
    onItemPress,
  }: PickerWheelProps) => {
    // Оформление колонки перекрывает общее оформление пикера.
    const merged = useMemo<PickerAppearance>(
      () => ({ ...appearance, ...stripUndefined(column) }),
      [appearance, column],
    );

    const values = useMemo(
      () =>
        asChildren<PickerItemProps>(column.children).map(
          item => item.props.value,
        ),
      [column.children],
    );

    const items = useMemo<NativeWheelPickerItem[]>(
      () =>
        asChildren<PickerItemProps>(column.children).map(({ props }) => ({
          label: props.label,
          value: String(props.value),
          disabled: props.disabled,
          color: resolveColor(props.color),
          testID: props.testID,
        })),
      [column.children, resolveColor],
    );

    const selectedIndex = useMemo(() => {
      const index = values.indexOf(column.selectedValue as PickerItemValue);

      return index < 0 ? 0 : index;
    }, [column.selectedValue, values]);

    const handleChange = useCallback(
      ({
        nativeEvent,
      }: {
        nativeEvent: { index: number; fromUser: boolean };
      }) => {
        const item = {
          column: columnIndex,
          index: nativeEvent.index,
          value: values[nativeEvent.index],
          fromUser: nativeEvent.fromUser,
        };

        onChange?.(item);
        column.onChange?.(item);
      },
      [column, columnIndex, onChange, values],
    );

    const handleScrollState = useCallback(
      ({ nativeEvent }: { nativeEvent: { state: number; index: number } }) => {
        const event = {
          column: columnIndex,
          state: SCROLL_STATES[nativeEvent.state] ?? "idle",
          index: nativeEvent.index,
          value: values[nativeEvent.index],
        };

        onScrollStateChange?.(event);
        column.onScrollStateChange?.(event);
      },
      [column, columnIndex, onScrollStateChange, values],
    );

    const handleScroll = useCallback(
      ({ nativeEvent }: { nativeEvent: { offset: number; index: number } }) => {
        const event = {
          column: columnIndex,
          offset: nativeEvent.offset,
          index: nativeEvent.index,
        };

        onScroll?.(event);
        column.onScroll?.(event);
      },
      [column, columnIndex, onScroll],
    );

    const handleItemPress = useCallback(
      ({ nativeEvent }: { nativeEvent: { index: number } }) => {
        const event = {
          column: columnIndex,
          index: nativeEvent.index,
          value: values[nativeEvent.index],
        };

        onItemPress?.(event);
        column.onItemPress?.(event);
      },
      [column, columnIndex, onItemPress, values],
    );

    const { indicator, curtain } = merged;

    return (
      <NativeWheelPicker
        style={
          column.width === undefined ? styles.flexible : { width: column.width }
        }
        items={items}
        selectedIndex={selectedIndex}
        loop={merged.loop}
        enabled={merged.enabled ?? true}
        stopAtDisabled={merged.stopAtDisabled ?? true}
        haptics={merged.haptics ?? DEFAULTS.haptics}
        scrollEventThrottle={merged.scrollEventThrottle ?? 0}
        itemHeight={merged.itemHeight ?? DEFAULTS.itemHeight}
        visibleItemCount={merged.visibleItemCount ?? DEFAULTS.visibleItemCount}
        itemSpacing={merged.itemSpacing ?? DEFAULTS.itemSpacing}
        itemColor={resolveColor(merged.itemColor) ?? defaultItemColor}
        selectedItemColor={
          resolveColor(merged.selectedItemColor) ?? defaultItemColor
        }
        disabledItemColor={
          resolveColor(merged.disabledItemColor) ?? defaultDisabledColor
        }
        fontSize={merged.fontSize ?? DEFAULTS.fontSize}
        selectedFontSize={merged.selectedFontSize ?? DEFAULTS.selectedFontSize}
        fontFamily={merged.fontFamily}
        fontWeight={merged.fontWeight ?? DEFAULTS.fontWeight}
        selectedFontWeight={
          merged.selectedFontWeight ?? DEFAULTS.selectedFontWeight
        }
        textAlign={merged.textAlign ?? DEFAULTS.textAlign}
        numberOfLines={merged.numberOfLines ?? DEFAULTS.numberOfLines}
        itemPaddingHorizontal={
          merged.itemPaddingHorizontal ?? DEFAULTS.itemPaddingHorizontal
        }
        curvature={merged.curvature ?? DEFAULTS.curvature}
        edgeOpacity={merged.edgeOpacity ?? DEFAULTS.edgeOpacity}
        edgeScale={merged.edgeScale ?? DEFAULTS.edgeScale}
        indicatorVisible={indicator?.visible ?? true}
        indicatorColor={resolveColor(indicator?.color) ?? defaultIndicatorColor}
        indicatorSize={indicator?.size ?? DEFAULTS.indicatorSize}
        indicatorStyle={indicator?.style ?? DEFAULTS.indicatorStyle}
        indicatorRadius={indicator?.radius ?? DEFAULTS.indicatorRadius}
        indicatorInset={indicator?.inset ?? DEFAULTS.indicatorInset}
        curtainVisible={curtain?.visible ?? false}
        curtainColor={resolveColor(curtain?.color)}
        curtainRadius={curtain?.radius ?? 0}
        onValueChange={handleChange}
        onScrollStateChange={handleScrollState}
        onScroll={merged.scrollEventThrottle ? handleScroll : undefined}
        onItemPress={handleItemPress}
      />
    );
  },
);

/** Props колонки без незаданных ключей: они не должны затирать общие. */
const stripUndefined = (column: PickerColumnProps): PickerAppearance => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(column)) {
    if (
      value !== undefined &&
      key !== "children" &&
      key !== "width" &&
      key !== "selectedValue" &&
      key !== "onChange" &&
      key !== "onScrollStateChange" &&
      key !== "onScroll" &&
      key !== "onItemPress"
    ) {
      result[key] = value;
    }
  }

  return result as PickerAppearance;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  flexible: {
    flexGrow: 1,
    flexBasis: 0,
  },
});
