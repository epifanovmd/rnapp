import { ITheme, useTheme, useThemeAwareObject } from "@theme";
import React, { FC, memo } from "react";
import {
  Animated,
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from "react-native";

import { FlexProps, useFlexProps } from "../../flexView";

export interface TextProps extends FlexProps<TextStyle>, RNTextProps {
  text?: string;
}

export const Text: FC<TextProps> = memo(({ text, children, ...rest }) => {
  const { theme } = useTheme();
  const styles = useThemeAwareObject(createStyles);
  const { ownProps, style, animated } = useFlexProps(rest);

  const Component = animated ? Animated.Text : RNText;

  return (
    <Component
      style={[styles.wrap, style, { color: style.color ?? theme.color.text }]}
      {...ownProps}
    >
      {text ?? children}
    </Component>
  );
});

const createStyles = (theme: ITheme) =>
  StyleSheet.create({
    wrap: {
      color: theme.color.text,
    },
  });
