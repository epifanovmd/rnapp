import * as React from "react";
import { forwardRef, memo, PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";

import { useFlexProps } from "./hooks";
import { FlexProps } from "./types";
import { createFlexViewComponent } from "./utils";

export type FlexViewProps = PropsWithChildren<FlexProps & ViewProps>;

export const _FlexView = memo(
  forwardRef<View, FlexViewProps>((props, ref) => {
    const { ownProps, style } = useFlexProps(props);

    return <View ref={ref} style={style} {...ownProps} />;
  }),
);

export const FlexView = Object.assign(_FlexView, {
  createFlexViewComponent,
});

export const Col = memo(
  forwardRef<View, FlexViewProps>((props, ref) => (
    <_FlexView ref={ref} col={true} {...props} />
  )),
);
export const Row = memo(
  forwardRef<View, FlexViewProps>((props, ref) => (
    <_FlexView ref={ref} row={true} {...props} />
  )),
);
