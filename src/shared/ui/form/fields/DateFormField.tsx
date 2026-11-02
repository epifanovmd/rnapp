import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { DateField, IDateFieldProps } from "../../date-field";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type DateFormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, Date | null | undefined>,
> = FormAdapterProps<TFormData, TName> &
  Omit<IDateFieldProps, "value" | "onChange" | "error" | "disabled"> & {
    onValueChange?: (date: Date | null) => void;
  };

/**
 * Поле даты, связанное с RHF: в форму пишется `Date` или `null` после сброса
 * (схема — `z.date().nullable()`/`.nullish()`); закрытие выбора — blur поля.
 *
 * @example
 * <DateFormField<TForm> name={"expiresAt"} label={"Действует до"} minDate={new Date()} />
 */
export const DateFormField = <
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, Date | null | undefined> =
    FieldPathByValue<TFormData, Date | null | undefined>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  onValueChange,
  ...dateProps
}: DateFormFieldProps<TFormData, TName>) => (
  <FormField
    name={name}
    control={control}
    rules={rules}
    shouldUnregister={shouldUnregister}
    defaultValue={defaultValue}
    disabled={disabled}
    render={({ field, fieldState }) => (
      <DateField
        {...dateProps}
        value={field.value ?? null}
        disabled={field.disabled}
        error={fieldState.error?.message}
        onChange={date => {
          field.onChange(date);
          field.onBlur();
          onValueChange?.(date);
        }}
      />
    )}
  />
);
