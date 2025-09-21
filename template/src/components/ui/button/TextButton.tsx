import { useTheme } from "@core";
import React, { FC, memo } from "react";

import { Button, IButtonProps } from "./Button";

interface ITextButtonProps extends IButtonProps {}

export const TextButton: FC<ITextButtonProps> = memo(({ ...rest }) => {
  const { colors } = useTheme();

  return (
    <Button
      borderColor={"transparent"}
      bg={"transparent"}
      borderWidth={0}
      color={colors.textPrimary}
      {...rest}
    />
  );
});
