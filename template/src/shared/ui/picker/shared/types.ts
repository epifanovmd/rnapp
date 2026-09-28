import type { TColorTheme } from "@shared/lib/theme";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

export type PickerItemValue = string | number;

/** Цвет: ключ темы или обычное значение цвета RN. */
export type PickerColor = keyof TColorTheme | ColorValue;

export type PickerScrollState = "idle" | "dragging" | "settling";

export type PickerChangeItem = {
  column: number;
  index: number;
  value: PickerItemValue;
  /** Изменение вызвано жестом, а не props */
  fromUser: boolean;
};

export type PickerScrollStateEvent = {
  column: number;
  state: PickerScrollState;
  index: number;
  value: PickerItemValue;
};

export type PickerItemPressEvent = {
  column: number;
  index: number;
  value: PickerItemValue;
};

export type PickerScrollEvent = {
  column: number;
  /** Смещение в элементах от первого элемента */
  offset: number;
  index: number;
};

/** Оформление линии выбора. */
export type PickerIndicatorConfig = {
  visible?: boolean;
  color?: PickerColor;
  /** Толщина линии/рамки, dp */
  size?: number;
  style?: "lines" | "box" | "fill";
  radius?: number;
  /** Горизонтальные отступы, dp */
  inset?: number;
};

/** Затемнение невыбранных элементов. */
export type PickerCurtainConfig = {
  visible?: boolean;
  color?: PickerColor;
  radius?: number;
};

/** Оформление и поведение колеса — общее для всех колонок пикера. */
export interface PickerAppearance {
  // поведение
  loop?: boolean;
  enabled?: boolean;
  /** Прокрутка упирается в ближайший недоступный элемент */
  stopAtDisabled?: boolean;
  haptics?: boolean;
  /** Интервал троттлинга `onScroll`, мс. 0 — событие выключено */
  scrollEventThrottle?: number;

  // геометрия
  itemHeight?: number;
  visibleItemCount?: number;
  itemSpacing?: number;

  // текст
  itemColor?: PickerColor;
  selectedItemColor?: PickerColor;
  disabledItemColor?: PickerColor;
  fontSize?: number;
  selectedFontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  selectedFontWeight?: "normal" | "medium" | "semibold" | "bold";
  textAlign?: "left" | "center" | "right";
  numberOfLines?: number;
  itemPaddingHorizontal?: number;

  // объём
  /** 0 — плоский список, 1 — выраженный барабан */
  curvature?: number;
  edgeOpacity?: number;
  edgeScale?: number;

  // оформление выбора
  indicator?: PickerIndicatorConfig;
  curtain?: PickerCurtainConfig;
}

export interface PickerProps extends PickerAppearance {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onChange?: (item: PickerChangeItem) => void;
  onScrollStateChange?: (event: PickerScrollStateEvent) => void;
  onScroll?: (event: PickerScrollEvent) => void;
  /** Нажатие по элементу: он доезжает до центра и выбирается */
  onItemPress?: (event: PickerItemPressEvent) => void;
}
