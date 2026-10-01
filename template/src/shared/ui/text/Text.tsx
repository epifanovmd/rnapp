import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import {
  ColorValue,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from "react-native";

import { FlexProps, useTextFlexProps } from "../flex-view";
import { getTextStyle, TTextStyle } from "./text-styles";

export interface ITextProps
  extends Omit<FlexProps<TextStyle>, "color">, RNTextProps {
  text?: string;
  textStyle?: keyof TTextStyle;
  /** Токен темы или произвольный цвет. */
  color?: keyof TColorTheme | ColorValue;
}

export const Text: FC<ITextProps> = memo(
  ({
    text,
    color: _color,
    textStyle = "Body_S2",
    style: styleProp,
    children,
    ...rest
  }) => {
    const { colors } = useTheme();
    const { ownProps, style } = useTextFlexProps(rest);
    const _textStyle = getTextStyle(textStyle);

    const color =
      style.color ??
      (_color === undefined
        ? colors.textPrimary
        : (colors[_color as keyof TColorTheme] ?? _color));

    return (
      <RNText style={[style, _textStyle, { color }, styleProp]} {...ownProps}>
        {text ?? children}
      </RNText>
    );
  },
);
