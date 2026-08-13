import { ColorValue, StyleProp, ViewStyle } from "react-native";
import { SharedValue } from "react-native-reanimated";

import { ICarouselPositionedControlProps } from "./carousel-control.types";

export type TCarouselProgressBarsMode = "scroll" | "timer";

export type TCarouselProgressBarsIdleVariant = "fill" | "move";

export interface ICarouselProgressBarsProps extends ICarouselPositionedControlProps {
  /** Источник заполнения: прокрутка либо таймер автоплея. */
  mode?: TCarouselProgressBarsMode;
  /** Отображение timer-режима при неактивном автоплее. */
  idleVariant?: TCarouselProgressBarsIdleVariant;
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
