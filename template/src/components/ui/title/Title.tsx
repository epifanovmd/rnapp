import { useRoute } from "@navigation";
import { observer } from "mobx-react-lite";
import React, { FC, PropsWithChildren } from "react";

import { useTranslation } from "../../../localization";
import { Col, FlexProps, Row, useFlexProps } from "../../flexView";
import { ITextProps, Text } from "../text";

export interface ITitleProps extends FlexProps {
  title?: string;
  rightSlot?: React.JSX.Element;
  textProps?: ITextProps;
}

export const Title: FC<PropsWithChildren<ITitleProps>> = observer(
  ({ title, rightSlot, textProps, children, ...rest }) => {
    const { flexProps, animated } = useFlexProps(rest);
    const route = useRoute();
    const { t } = useTranslation();

    const _title = title || t(`navigation.${route.name}` as any);

    return (
      <Row
        minHeight={36}
        pv={4}
        mb={4}
        alignItems={"center"}
        justifyContent={"space-between"}
        {...flexProps}
        animated={animated}
      >
        {children ?? (
          <Text fontSize={18} fontWeight={"600"} {...textProps}>
            {_title}
          </Text>
        )}

        <Col>{rightSlot}</Col>
      </Row>
    );
  },
);
