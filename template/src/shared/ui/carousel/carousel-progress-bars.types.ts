import { ColorValue, StyleProp, ViewStyle } from "react-native";
import { SharedValue } from "react-native-reanimated";

export type TCarouselProgressBarsMode = "scroll" | "timer";

export type TCarouselProgressBarsIdleVariant = "fill" | "move";

export type TCarouselProgressBarsPosition = "top" | "bottom";

export type TCarouselProgressBarsPlacement = "inside" | "outside";

export interface ICarouselProgressBarsProps {
  /** Источник заполнения: прокрутка либо таймер автоплея. */
  mode?: TCarouselProgressBarsMode;
  /** Отображение timer-режима при неактивном автоплее. */
  idleVariant?: TCarouselProgressBarsIdleVariant;
  /** Вертикальная сторона карусели. */
  position?: TCarouselProgressBarsPosition;
  /** Разместить полосы поверх карусели либо за её границей. */
  placement?: TCarouselProgressBarsPlacement;
  /** Отступ от выбранной границы карусели. */
  inset?: number;
  height?: number;
  gap?: number;
  color?: ColorValue;
  trackColor?: ColorValue;
  style?: StyleProp<ViewStyle>;
}

export interface ICarouselProgressBarProps {
  index: number;
  mode: TCarouselProgressBarsMode;
  idleVariant: TCarouselProgressBarsIdleVariant;
  timer: SharedValue<number>;
  timerIndex: SharedValue<number>;
  color: ColorValue;
}
