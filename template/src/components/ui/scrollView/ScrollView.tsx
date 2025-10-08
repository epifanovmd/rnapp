import React, { FC, memo } from "react";
import {
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
} from "react-native";

import { FlexProps, useFlexProps } from "../../flexView";

export interface IScrollViewProps
  extends FlexProps,
    Omit<RNScrollViewProps, "style" | "centerContent"> {}

export const ScrollView: FC<IScrollViewProps> = memo(
  ({ children, keyboardShouldPersistTaps = "handled", ...rest }) => {
    const { style, ownProps } = useFlexProps(rest);

    return (
      <RNScrollView
        style={style}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...ownProps}
      >
        {children}
      </RNScrollView>
    );
  },
);
