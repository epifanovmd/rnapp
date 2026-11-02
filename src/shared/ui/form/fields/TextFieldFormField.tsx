import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { ITextFieldProps, TextField } from "../../input";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type TextFieldFormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, string | undefined>,
> = FormAdapterProps<TFormData, TName> &
  Omit<ITextFieldProps, "defaultValue" | "error" | "onChangeText" | "value"> & {
    onValueChange?: (value: string) => void;
  };

/** Текстовое поле, связанное с RHF и сообщением ошибки схемы. */
export const TextFieldFormField = <
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, string | undefined> =
    FieldPathByValue<TFormData, string | undefined>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  editable,
  onBlur,
  onValueChange,
  ...textFieldProps
}: TextFieldFormFieldProps<TFormData, TName>) => (
  <FormField
    name={name}
    control={control}
    rules={rules}
    shouldUnregister={shouldUnregister}
    defaultValue={defaultValue}
    disabled={disabled}
    render={({ field, fieldState }) => (
      <TextField
        {...textFieldProps}
        ref={field.ref}
        editable={field.disabled ? false : editable}
        error={fieldState.error?.message}
        value={String(field.value ?? "")}
        onBlur={event => {
          field.onBlur();
          onBlur?.(event);
        }}
        onChangeText={value => {
          field.onChange(value);
          onValueChange?.(value);
        }}
      />
    )}
  />
);
