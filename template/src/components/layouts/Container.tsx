import React, { FC, memo, PropsWithChildren } from "react";
import { ViewProps } from "react-native";
import { Edges, SafeAreaView } from "react-native-safe-area-context";

import { FlexProps, useFlexProps } from "../flexView";

interface IProps extends FlexProps, ViewProps {
  edges?: Edges;
}

export const Container: FC<PropsWithChildren<IProps>> = memo(
  ({ edges = ["bottom"] as Edges, children, ...rest }) => {
    const { style, ownProps } = useFlexProps(rest, { flex: 1 });

    return (
      <SafeAreaView edges={edges} style={style} {...ownProps}>
        {children}
      </SafeAreaView>
    );
  },
);
