import React, { forwardRef } from "react";
import { View } from "react-native";

import { FlexViewProps } from "./FlexView";
import { useFlexProps } from "./hooks";
import { FlexProps } from "./types";

const COL_DEFAULT_PROPS: FlexProps = { col: true };

export const Col = forwardRef<View, FlexViewProps>((props, ref) => {
  const { ownProps, style } = useFlexProps(props, COL_DEFAULT_PROPS);

  return <View ref={ref} style={style} {...ownProps} />;
});
