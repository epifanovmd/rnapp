import { useTheme } from "@theme";
import React, { FC, memo } from "react";

import { Button, ButtonProps } from "./Button";

interface TextButtonProps extends ButtonProps {}

export const TextButton: FC<TextButtonProps> = memo(({ ...rest }) => {
  const { theme } = useTheme();

  return (
    <Button
      borderColor={"transparent"}
      bg={"transparent"}
      borderWidth={0}
      color={theme.color.text}
      {...rest}
    />
  );
});
