import React from "react";
import { FieldPath, FieldValues } from "react-hook-form";

import { ISelectProps, Select, SelectValue } from "../../select";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type SelectFormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData>,
  V extends SelectValue = string,
> = FormAdapterProps<TFormData, TName> &
  Omit<ISelectProps<V>, "value" | "onChange" | "error"> & {
    onValueChange?: (value: V | null) => void;
  };

/** Select, связанный с RHF: в форму пишется значение варианта или `null`. */
export const SelectFormField = <
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData> = FieldPath<TFormData>,
  V extends SelectValue = string,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  onValueChange,
  ...selectProps
}: SelectFormFieldProps<TFormData, TName, V>) => (
  <FormField
    name={name}
    control={control}
    rules={rules}
    shouldUnregister={shouldUnregister}
    defaultValue={defaultValue}
    disabled={disabled}
    render={({ field, fieldState }) => (
      <Select<V>
        {...selectProps}
        disabled={field.disabled}
        error={fieldState.error?.message}
        value={field.value ?? null}
        onChange={next => {
          field.onChange(next);
          field.onBlur();
          onValueChange?.(next);
        }}
      />
    )}
  />
);
