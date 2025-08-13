import { useTheme } from "@core";
import React, { FC, memo } from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from "react-native";
import Animated from "react-native-reanimated";

import { FlexProps, useFlexProps } from "../../flexView";

export interface ITextProps extends FlexProps<TextStyle>, RNTextProps {
  text?: string;
}

export const Text: FC<ITextProps> = memo(({ text, children, ...rest }) => {
  const { theme } = useTheme();
  const { ownProps, style, animated } = useFlexProps(rest);

  const Component = animated ? Animated.Text : RNText;

  return (
    <Component
      style={[style, { color: style.color ?? theme.color.text }]}
      {...ownProps}
    >
      {text ?? children}
    </Component>
  );
});
