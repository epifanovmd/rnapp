import React from "react";
import { FieldPath, FieldValues, useController } from "react-hook-form";

import { FormAdapterProps, FormFieldRenderProps } from "../types";

export interface FormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData> = FieldPath<TFormData>,
> extends FormAdapterProps<TFormData, TName> {
  render: (props: FormFieldRenderProps<TFormData, TName>) => React.ReactNode;
}

/** Базовый адаптер RHF для создания типизированных контролов формы. */
export const FormField = <
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData> = FieldPath<TFormData>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  render,
}: FormFieldProps<TFormData, TName>) => {
  const state = useController({
    name,
    control,
    rules,
    shouldUnregister,
    defaultValue,
    disabled,
  });

  return <>{render(state)}</>;
};
