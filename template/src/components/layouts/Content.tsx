import React, { FC, memo, PropsWithChildren } from "react";

import { Col, FlexProps } from "../flexView";

interface IProps extends FlexProps {}

export const Content: FC<PropsWithChildren<IProps>> = memo(
  ({ children, ...rest }) => {
    return (
      <Col flex={1} ph={8} pb={8} {...rest}>
        {children}
      </Col>
    );
  },
);
