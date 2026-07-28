import { useRoute } from "@shared/lib/navigation";
import { observer } from "mobx-react-lite";
import React, { FC, PropsWithChildren } from "react";

import { Col, FlexProps, Row, useFlexProps } from "../flex-view/index";
import { ITextProps, Text } from "../text/index";

export interface ITitleProps extends FlexProps {
  title?: string;
  rightSlot?: React.JSX.Element;
  textProps?: ITextProps;
}

export const Title: FC<PropsWithChildren<ITitleProps>> = observer(
  ({ title, rightSlot, textProps, children, ...rest }) => {
    const { flexProps } = useFlexProps(rest);
    const route = useRoute();

    return (
      <Row
        minHeight={36}
        pv={4}
        mb={4}
        alignItems={"center"}
        justifyContent={"space-between"}
        {...flexProps}
      >
        {children ?? (
          <Text textStyle={"Title_L"} {...textProps}>
            {title || route.name}
          </Text>
        )}

        <Col>{rightSlot}</Col>
      </Row>
    );
  },
);
