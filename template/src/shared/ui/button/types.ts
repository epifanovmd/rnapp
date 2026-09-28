import { TColorTheme } from "@shared/lib/theme";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";

import { TIconName } from "../icon";
import { ISpinnerProps } from "../spinner";
import { ITouchableProps } from "../touchable";

/** Смысловой цвет кнопки; новый вариант добавляется одной строкой палитры. */
export type TButtonVariant = "primary" | "secondary" | "danger";

/** Визуальное исполнение, ортогонально варианту. */
export type TButtonAppearance = "filled" | "outline" | "ghost";

export type TButtonSize = "medium" | "small";

export interface IButtonProps<T = unknown> extends ITouchableProps<T> {
  title?: React.JSX.Element | string;
  variant?: TButtonVariant;
  appearance?: TButtonAppearance;
  size?: TButtonSize;
  /** Переопределение цвета контента (и рамки у outline). */
  color?: keyof TColorTheme;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  indicatorProps?: Partial<ISpinnerProps>;
  leftIcon?: TIconName;
  rightIcon?: TIconName;
}
