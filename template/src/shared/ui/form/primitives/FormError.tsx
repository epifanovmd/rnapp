import React from "react";
import { useFormContext, useFormState } from "react-hook-form";

import { ITextProps, Text } from "../../text";

export interface FormErrorProps extends Omit<ITextProps, "children"> {
  message?: string;
}

/** Показывает переданное сообщение либо ошибку RHF `root`. */
export const FormError = ({ message, ...props }: FormErrorProps) => {
  const { control } = useFormContext();
  const { errors } = useFormState({ control });
  const content = message ?? errors.root?.message;

  if (typeof content !== "string" || !content) {
    return null;
  }

  return (
    <Text accessibilityRole={"alert"} color={"danger"} {...props}>
      {content}
    </Text>
  );
};
