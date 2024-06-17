import React, { FC, memo, PropsWithChildren } from "react";

import { Text, TextProps } from "../text";

export interface FieldLabelProps extends TextProps {
  hasValue?: boolean;
}

export const FieldLabel: FC<PropsWithChildren<FieldLabelProps>> = memo(
  ({ hasValue, children, ...rest }) => {
    return (
      <Text
        fontSize={hasValue ? 11 : 14}
        zIndex={1}
        ellipsizeMode={"tail"}
        {...rest}
      >
        {children}
      </Text>
    );
  },
);
