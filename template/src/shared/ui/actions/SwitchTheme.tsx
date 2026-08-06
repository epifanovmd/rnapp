import { useTheme } from "@shared/lib/theme";
import React, { FC, memo, PropsWithChildren } from "react";

import { FlexProps, Row } from "../flex-view";
import { Switch } from "../switch";

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
