import React, { FC, memo } from "react";

import { Button, IButtonProps } from "./Button";

interface BorderButtonProps extends IButtonProps {}

export const BorderButton: FC<BorderButtonProps> = memo(
  ({ color = "#000", ...rest }) => {
    return (
      <Button borderWidth={2} bg={"transparent"} color={color} {...rest} />
    );
  },
);
