import { TColorTheme } from "@shared/lib/theme";
import { StyleSheet, TextStyle, ViewStyle } from "react-native";

import { FlexProps } from "../types";
import {
  flexBooleanValuesMap,
  themeColorFlexPropsSet,
  transformFlexPropsSet,
  TStyleKeysMap,
  viewStyleKeysMap,
} from "./flex-props-map";
import { shadowStyle } from "./shadow-style";

export const flexPropsConverter = <
  TProps extends FlexProps,
  TOwnProps = Omit<TProps, keyof FlexProps>,
  TStyleSource extends TextStyle & ViewStyle = TextStyle & ViewStyle,
>(
  props: TProps,
  outOwnProps: TOwnProps,
  outStyleSource: TStyleSource,
  colors?: TColorTheme,
  styleKeysMap: TStyleKeysMap = viewStyleKeysMap,
) => {
  const op = outOwnProps as any;
  const os = outStyleSource as any;
  const c = colors as Record<string, unknown> | undefined;

  for (const key in props) {
    if (!Object.prototype.hasOwnProperty.call(props, key) || key === "style") {
      continue;
    }

    const value: any = props[key];

    if (value === undefined) {
      continue;
    }

    const styleKeys = styleKeysMap[key];

    if (styleKeys) {
      let styleValue =
        typeof value === "boolean"
          ? (flexBooleanValuesMap[key] ?? value)
          : value;

      if (c && themeColorFlexPropsSet.has(key)) {
        styleValue = c[styleValue] ?? styleValue;
      }

      for (const styleKey of styleKeys) {
        os[styleKey] = styleValue;
      }
    } else if (transformFlexPropsSet.has(key)) {
      (os.transform ??= []).push({ [key]: value });
    } else if (key === "elevation") {
      Object.assign(os, shadowStyle(value));
    } else if (key === "circle") {
      os.width = value;
      os.height = value;
      os.borderRadius = value / 2;
    } else if (key === "absoluteFill") {
      if (value === true) {
        os.position = "absolute";
        os.left = 0;
        os.right = 0;
        os.top = 0;
        os.bottom = 0;
      }
    } else if (key === "debug") {
      if (value === true) {
        os.backgroundColor = "red";
      }
    } else {
      op[key] = value;
    }
  }

  if (props.style) {
    Object.assign(os, StyleSheet.flatten(props.style));
  }
};
