import React from "react";
import { useFormContext, useFormState } from "react-hook-form";

import { Button, IButtonProps } from "../../button";
import { useFormSubmit } from "./form-context";

export interface FormSubmitProps extends Omit<IButtonProps, "onPress"> {
  disableWhenInvalid?: boolean;
}

/** Кнопка отправки ближайшей Form с состоянием загрузки из RHF. */
export const FormSubmit = ({
  disableWhenInvalid = false,
  disabled,
  loading,
  ...props
}: FormSubmitProps) => {
  const { control } = useFormContext();
  const { isSubmitting, isValid } = useFormState({ control });
  const { submit } = useFormSubmit();

  return (
    <Button
      {...props}
      disabled={disabled || (disableWhenInvalid && !isValid)}
      loading={loading || isSubmitting}
      onPress={submit}
    />
  );
};
