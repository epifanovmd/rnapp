import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import {
  Select,
  SelectBaseProps,
  SelectMultiDisplayProps,
  SelectValue,
} from "../../select";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type MultiSelectFormFieldProps<
  TFormData extends FieldValues,
  TValue extends SelectValue,
  TName extends FieldPathByValue<TFormData, TValue[] | undefined>,
> = FormAdapterProps<TFormData, TName> &
  Omit<SelectBaseProps<TValue>, "errorMessage"> &
  SelectMultiDisplayProps & {
    clearable?: boolean;
    onValueChange?: (value: TValue[]) => void;
  };

/**
 * Multi-Select, связанный с RHF: в форму пишется массив значений; закрытие
 * шторки — blur поля.
 *
 * @example
 * <MultiSelectFormField<TForm> name={"roles"} label={"Роли"} options={options} />
 */
export const MultiSelectFormField = <
  TFormData extends FieldValues,
  TValue extends SelectValue = string,
  TName extends FieldPathByValue<TFormData, TValue[] | undefined> =
    FieldPathByValue<TFormData, TValue[] | undefined>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  onValueChange,
  onOpenChange,
  ...selectProps
}: MultiSelectFormFieldProps<TFormData, TValue, TName>) => (
  <FormField
    name={name}
    control={control}
    rules={rules}
    shouldUnregister={shouldUnregister}
    defaultValue={defaultValue}
    disabled={disabled}
    render={({ field, fieldState }) => (
      <Select<TValue>
        {...selectProps}
        multi
        labelInValue={false}
        value={(field.value ?? []) as TValue[]}
        disabled={field.disabled}
        errorMessage={fieldState.error?.message}
        onOpenChange={open => {
          if (!open) field.onBlur();
          onOpenChange?.(open);
        }}
        onChange={(next: TValue[]) => {
          field.onChange(next);
          onValueChange?.(next);
        }}
      />
    )}
  />
);
