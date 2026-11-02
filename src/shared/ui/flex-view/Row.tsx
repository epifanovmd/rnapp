import React, { forwardRef } from "react";
import { View } from "react-native";

import { FlexViewProps } from "./FlexView";
import { useFlexProps } from "./hooks";
import { FlexProps } from "./types";

const ROW_DEFAULT_PROPS: FlexProps = { row: true };

export const Row = forwardRef<View, FlexViewProps>((props, ref) => {
  const { ownProps, style } = useFlexProps(props, ROW_DEFAULT_PROPS);

  return <View ref={ref} style={style} {...ownProps} />;
});
