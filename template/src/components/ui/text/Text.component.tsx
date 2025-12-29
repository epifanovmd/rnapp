import { TColorTheme, useTheme } from "@core";
import React, { FC, memo } from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from "react-native";

import { FlexProps, useFlexProps } from "../../flexView";
import { getTextStyle, TTextStyle } from "./Text.style";

export interface ITextProps
  extends Omit<FlexProps<TextStyle>, "color">,
    RNTextProps {
  text?: string;
  textStyle?: keyof TTextStyle;
  color?: keyof TColorTheme;
}

export const Text: FC<ITextProps> = memo(
  ({ text, color: _color, textStyle = "Body_S2", children, ...rest }) => {
    const { colors } = useTheme();
    const { ownProps, style } = useFlexProps(rest);
    const _textStyle = getTextStyle(textStyle);

    const color = style.color ?? colors[_color ?? "textPrimary"];

    return (
      <RNText style={[style, _textStyle, { color }]} {...ownProps}>
        {text ?? children}
      </RNText>
    );
  },
);
