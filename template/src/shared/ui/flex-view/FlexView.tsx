import * as React from "react";
import { forwardRef, PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";

import { useFlexProps } from "./hooks";
import { FlexProps } from "./types";
import { createFlexViewComponent } from "./utils";

export type FlexViewProps = PropsWithChildren<FlexProps & ViewProps>;

export const FlexView = Object.assign(
  forwardRef<View, FlexViewProps>((props, ref) => {
    const { ownProps, style } = useFlexProps(props);

    return <View ref={ref} style={style} {...ownProps} />;
  }),
  { createFlexViewComponent },
);
