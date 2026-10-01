import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { ITextFieldProps } from "../../input";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";
import { NumberTextField } from "./NumberTextField";

type TNumberFieldValue = number | null | undefined;

export type NumberFieldFormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, TNumberFieldValue>,
> = FormAdapterProps<TFormData, TName> &
  Omit<
    ITextFieldProps,
    "defaultValue" | "error" | "onChangeText" | "value" | "keyboardType"
  > & {
    allowDecimal?: boolean;
    onValueChange?: (value: number | null) => void;
  };

/** Числовое поле RHF: в форму пишется число или `null` (пустое поле). */
export const NumberFieldFormField = <
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, TNumberFieldValue> =
    FieldPathByValue<TFormData, TNumberFieldValue>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  editable,
  allowDecimal,
  onValueChange,
  ...textFieldProps
}: NumberFieldFormFieldProps<TFormData, TName>) => (
  <FormField
    name={name}
    control={control}
    rules={rules}
    shouldUnregister={shouldUnregister}
    defaultValue={defaultValue}
    disabled={disabled}
    render={({ field, fieldState }) => (
      <NumberTextField
        {...textFieldProps}
        ref={field.ref}
        editable={field.disabled ? false : editable}
        error={fieldState.error?.message}
        value={field.value}
        allowDecimal={allowDecimal}
        onBlur={event => {
          field.onBlur();
          textFieldProps.onBlur?.(event);
        }}
        onValueChange={next => {
          field.onChange(next);
          onValueChange?.(next);
        }}
      />
    )}
  />
);
