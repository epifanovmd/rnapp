import { TColorTheme } from "@core";
import React from "react";
import {
  ActivityIndicatorProps,
  ColorValue,
  StyleProp,
  ViewStyle,
} from "react-native";

import { TIconName } from "../icon";
import { ITouchableProps } from "../touchable";

export type TButtonType =
  | "primaryFilled"
  | "primaryOutline"
  | "secondaryFilled"
  | "secondaryOutline"
  | "dangerFilled"
  | "dangerOutline"
  | "text";

export type TButtonSize = "medium" | "small";

export interface IButtonProps<T = unknown> extends ITouchableProps<T> {
  title?: React.JSX.Element | string;
  type?: TButtonType;
  size?: TButtonSize;
  color?: keyof TColorTheme;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  indicatorProps?: ActivityIndicatorProps;
  leftIcon?: TIconName;
  rightIcon?: TIconName;
}
