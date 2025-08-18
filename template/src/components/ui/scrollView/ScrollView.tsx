import React, { FC, memo } from "react";
import {
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
} from "react-native";
import Animated from "react-native-reanimated";

import { FlexProps, useFlexProps } from "../../flexView";

export interface IScrollViewProps
  extends FlexProps,
    Omit<RNScrollViewProps, "style" | "centerContent"> {}

export const ScrollView: FC<IScrollViewProps> = memo(
  ({ children, keyboardShouldPersistTaps = "handled", ...rest }) => {
    const { style, ownProps, animated } = useFlexProps(rest);

    const Component = animated ? Animated.ScrollView : RNScrollView;

    return (
      <Component
        style={style}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...ownProps}
      >
        {children}
      </Component>
    );
  },
);
