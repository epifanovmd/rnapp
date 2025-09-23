import { useTheme } from "@core";
import React, { FC, memo } from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from "react-native";
import Animated from "react-native-reanimated";

import { FlexProps, useFlexProps } from "../../flexView";
import { getTextStyle, TTextStyle } from "./Text.style";

export interface ITextProps extends FlexProps<TextStyle>, RNTextProps {
  text?: string;
  textStyle?: keyof TTextStyle;
}

export const Text: FC<ITextProps> = memo(
  ({ text, textStyle = "Body_S2", children, ...rest }) => {
    const { colors } = useTheme();
    const { ownProps, style, animated } = useFlexProps(rest);
    const _textStyle = getTextStyle(textStyle);

    const Component = animated ? Animated.Text : RNText;

    return (
      <Component
        style={[
          style,
          _textStyle,
          { color: style.color ?? colors.onSurfaceHigh },
        ]}
        {...ownProps}
      >
        {text ?? children}
      </Component>
    );
  },
);
