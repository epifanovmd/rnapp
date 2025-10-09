import { useTheme } from "@core";
import React, { FC, memo, PropsWithChildren } from "react";

import { FlexProps, Row } from "../flexView";
import { Switch } from "../ui";

interface IProps extends FlexProps {}

export const SwitchTheme: FC<PropsWithChildren<IProps>> = memo(
  ({ ...rest }) => {
    const { isLight, toggleTheme } = useTheme();

    return (
      <Row gap={8} {...rest}>
        <Switch isActive={isLight} onChange={toggleTheme} />
      </Row>
    );
  },
);
