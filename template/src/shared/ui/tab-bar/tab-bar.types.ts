import type { TColorTheme } from "@shared/lib/theme";
import type { ReactNode } from "react";
import type {
  ColorValue,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import type { AnimatedStyle } from "react-native-reanimated";

/** Цвет: токен темы или значение. */
export type TTabBarColor = keyof TColorTheme | ColorValue;

export interface ITabBarIconState {
  focused: boolean;
  color: string;
  size: number;
}

export interface ITabBarItem {
  key: string;
  title?: string;
  renderIcon: (state: ITabBarIconState) => ReactNode;
  /** Бейдж: число/строка — счётчик, `true` — точка. */
  badge?: number | string | boolean;
  accessibilityLabel?: string;
}

/** `floating` — плавающая пилюля над краем; `docked` — во всю ширину у нижнего края. */
export type TTabBarVariant = "floating" | "docked";
/** Подписи: у всех, только у активной (вкладка расширяется), без подписей. */
export type TTabBarLabels = "always" | "active" | "never";
/** Подпись под иконкой или рядом с ней. */
export type TTabBarLabelPosition = "below" | "beside";
/** Отметка выбора. */
export type TTabBarIndicator = "pill" | "dot" | "line" | "none";
/** `worm` — края подложки едут с задержкой, `slide` — вместе. */
export type TTabBarIndicatorAnimation = "worm" | "slide";
/** Фон: размытие (тип по теме) или сплошной. */
export type TTabBarSurface = "blur" | "solid";
/** Ширина плавающей панели: по экрану или по вкладкам. */
export type TTabBarFit = "fill" | "hug";

export interface ITabBarAppearance {
  /** По умолчанию `"floating"`. */
  variant?: TTabBarVariant;
  /** По умолчанию `"always"`. */
  labels?: TTabBarLabels;
  /** По умолчанию: `"beside"` при `labels="active"`, иначе `"below"`. */
  labelPosition?: TTabBarLabelPosition;
  /** По умолчанию `"pill"`. */
  indicator?: TTabBarIndicator;
  /** По умолчанию `"worm"`. */
  indicatorAnimation?: TTabBarIndicatorAnimation;
  /** По умолчанию `"blur"`. */
  surface?: TTabBarSurface;
  /** По умолчанию: `"hug"` без подписей у плавающей, иначе `"fill"`. */
  fit?: TTabBarFit;
  /** Иконка и подпись активной вкладки. По умолчанию `primary`. */
  activeColor?: TTabBarColor;
  /** Иконки и подписи прочих. По умолчанию `textSecondary`. */
  inactiveColor?: TTabBarColor;
  /** Цвет подложки/точки/линии. По умолчанию — `activeColor` с прозрачностью для `pill`. */
  indicatorColor?: TTabBarColor;
  /** Пружинка иконки при выборе. По умолчанию `"bounce"`. */
  iconAnimation?: "bounce" | "none";
  /** Вибрация при переключении. По умолчанию `true`. */
  haptics?: boolean;
  /** Во сколько раз активная вкладка шире. По умолчанию 2.4 при `labels="active"`, иначе 1. */
  activeWeight?: number;
  /** Ширина вкладки при `fit="hug"`, px. По умолчанию 56. */
  itemWidth?: number;
  /** Размер иконок, px. По умолчанию 22. */
  iconSize?: number;
  /** Длительность переключения, мс. По умолчанию 250. */
  duration?: number;
}

export interface ITabBarProps extends ITabBarAppearance {
  items: ITabBarItem[];
  activeIndex: number;
  onPress: (key: string, index: number) => void;
  onLongPress?: (key: string, index: number) => void;
  /** Нижний отступ (safe area): у `floating` — над ним, у `docked` — внутри. */
  bottomInset?: number;
  /** Стиль контейнера (в т.ч. анимированный — скрытие при скролле). */
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  onLayout?: (event: LayoutChangeEvent) => void;
}
