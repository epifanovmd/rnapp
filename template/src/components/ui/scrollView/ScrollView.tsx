import { FlexProps, useFlexProps } from "@force-dev/react-mobile";
import React, { FC, memo } from "react";
import {
  Animated,
  ScrollView as _ScrollView,
  ScrollViewProps as _ScrollViewProps,
} from "react-native";

export interface ScrollViewProps
  extends FlexProps,
    Omit<_ScrollViewProps, "style" | "centerContent"> {}

export const ScrollView: FC<ScrollViewProps> = memo(({ children, ...rest }) => {
  const { style, ownProps, animated } = useFlexProps(rest);

  const Component = animated ? Animated.ScrollView : _ScrollView;

  return (
    <Component style={style} {...ownProps}>
      {children}
    </Component>
  );
});
