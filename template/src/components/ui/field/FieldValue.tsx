import { FlexProps, Row } from "@force-dev/react-mobile";
import React, { FC, memo, PropsWithChildren } from "react";
import { ViewProps } from "react-native";

export interface FieldValueProps extends FlexProps, ViewProps {}

export const FieldValue: FC<PropsWithChildren<FieldValueProps>> = memo(
  ({ children, ...rest }) => {
    return (
      <Row paddingTop={2} {...rest}>
        {children}
      </Row>
    );
  },
);
