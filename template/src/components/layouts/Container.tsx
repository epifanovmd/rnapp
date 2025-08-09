import React, { FC, memo, PropsWithChildren } from "react";
import { StyleSheet, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Edges } from "react-native-safe-area-context/src/SafeArea.types";

import { Col, FlexProps } from "../flexView";

interface IProps extends FlexProps, ViewProps {
  edges?: Edges;
}

export const Container: FC<PropsWithChildren<IProps>> = memo(
  ({ edges = ["top", "bottom"] as Edges, style, children, ...rest }) => {
    return (
      <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
        <Col flex={1} {...rest}>
          {children}
        </Col>
      </SafeAreaView>
    );
  },
);
