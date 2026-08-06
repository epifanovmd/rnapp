// NativeWheelPickerSpec.ts
// Спецификация нативного колеса выбора для codegen. Один нативный вью — одно
// колесо; многоколоночные пикеры собираются из нескольких вью на стороне JS.

import React from "react";
import type { ColorValue, HostComponent, ViewProps } from "react-native";
import { codegenNativeCommands, codegenNativeComponent } from "react-native";
import type {
  DirectEventHandler,
  Double,
  Int32,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";

// ─── Данные ──────────────────────────────────────────────────────────────────

/** Элемент колеса. `value` строковый: индекс — общий контракт обеих платформ. */
export type NativeWheelPickerItem = {
  /** Подпись */
  label: string;
  /** Значение, возвращаемое в событиях */
  value: string;
  /** Недоступен для выбора */
  disabled?: boolean;
  /** Цвет подписи, перекрывает `itemColor` */
  color?: ColorValue;
  testID?: string;
};

// ─── События ─────────────────────────────────────────────────────────────────

/** Выбор остановился на элементе */
export type NativeWheelPickerChangeEvent = {
  index: Int32;
  value: string;
  /** Изменение вызвано жестом пользователя, а не props */
  fromUser: boolean;
};

/** Смена состояния прокрутки: 0 — покой, 1 — тянут пальцем, 2 — инерция */
export type NativeWheelPickerScrollStateEvent = {
  state: Int32;
  index: Int32;
  value: string;
};

/** Нажатие по элементу колеса */
export type NativeWheelPickerItemPressEvent = {
  index: Int32;
  value: string;
};

/** Непрерывная прокрутка (троттлится нативно) */
export type NativeWheelPickerScrollEvent = {
  /** Смещение в элементах от первого элемента */
  offset: Double;
  /** Ближайший к центру индекс */
  index: Int32;
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface NativeWheelPickerProps extends ViewProps {
  // данные
  items: ReadonlyArray<NativeWheelPickerItem>;
  /** Управляемый выбранный индекс */
  selectedIndex?: WithDefault<Int32, 0>;

  // поведение
  /** Бесконечная прокрутка */
  loop?: WithDefault<boolean, false>;
  /** Колесо целиком доступно для жестов */
  enabled?: WithDefault<boolean, true>;
  /** Прокрутка упирается в ближайший недоступный элемент */
  stopAtDisabled?: WithDefault<boolean, true>;
  /** Тактильный отклик при смене элемента */
  haptics?: WithDefault<boolean, true>;
  /** Интервал троттлинга `onScroll`, мс. 0 — событие выключено */
  scrollEventThrottle?: WithDefault<Int32, 0>;

  // геометрия
  /** Высота одного элемента, dp */
  itemHeight?: WithDefault<Double, 44>;
  /** Сколько элементов видно целиком (нечётное) */
  visibleItemCount?: WithDefault<Int32, 5>;
  /** Дополнительный зазор между элементами, dp */
  itemSpacing?: WithDefault<Double, 0>;

  // текст
  itemColor?: ColorValue;
  selectedItemColor?: ColorValue;
  disabledItemColor?: ColorValue;
  fontSize?: WithDefault<Double, 20>;
  selectedFontSize?: WithDefault<Double, 20>;
  fontFamily?: string;
  /** "normal" | "medium" | "semibold" | "bold" */
  fontWeight?: WithDefault<string, "normal">;
  /** "normal" | "medium" | "semibold" | "bold" */
  selectedFontWeight?: WithDefault<string, "normal">;
  /** "left" | "center" | "right" */
  textAlign?: WithDefault<string, "center">;
  numberOfLines?: WithDefault<Int32, 1>;
  /** Горизонтальные отступы подписи, dp */
  itemPaddingHorizontal?: WithDefault<Double, 8>;

  // объём колеса
  /** Изгиб барабана: 0 — плоский список, 1 — выраженный цилиндр */
  curvature?: WithDefault<Double, 1>;
  /** Затухание краёв: непрозрачность крайнего элемента */
  edgeOpacity?: WithDefault<Double, 0.25>;
  /** Масштаб крайнего элемента */
  edgeScale?: WithDefault<Double, 0.8>;

  // индикатор выбранной строки
  indicatorVisible?: WithDefault<boolean, true>;
  indicatorColor?: ColorValue;
  /** Толщина линии, dp. Для рамки — толщина обеих линий */
  indicatorSize?: WithDefault<Double, 1>;
  /** "fill" — заливка полосы выбора, "lines" — линии сверху и снизу, "box" — рамка */
  indicatorStyle?: WithDefault<string, "fill">;
  indicatorRadius?: WithDefault<Double, 0>;
  /** Горизонтальные отступы индикатора, dp */
  indicatorInset?: WithDefault<Double, 0>;

  // шторка над невыбранными элементами
  curtainVisible?: WithDefault<boolean, false>;
  curtainColor?: ColorValue;
  curtainRadius?: WithDefault<Double, 0>;

  // события
  onValueChange?: DirectEventHandler<NativeWheelPickerChangeEvent>;
  onScrollStateChange?: DirectEventHandler<NativeWheelPickerScrollStateEvent>;
  onScroll?: DirectEventHandler<NativeWheelPickerScrollEvent>;
  /** Нажатие по элементу: элемент доезжает до центра и выбирается */
  onItemPress?: DirectEventHandler<NativeWheelPickerItemPressEvent>;
}

// ─── Команды ─────────────────────────────────────────────────────────────────

export interface NativeWheelPickerCommands {
  /** Прокрутить к индексу вне управляемого потока props */
  scrollToIndex(
    viewRef: React.ComponentRef<HostComponent<NativeWheelPickerProps>>,
    index: Int32,
    animated: boolean,
  ): void;
}

export const Commands = codegenNativeCommands<NativeWheelPickerCommands>({
  supportedCommands: ["scrollToIndex"],
});

export default codegenNativeComponent<NativeWheelPickerProps>(
  "RNWheelPicker",
) as HostComponent<NativeWheelPickerProps>;
