import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { Select, SelectBaseProps, SelectValue } from "../../select";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type SelectFormFieldProps<
  TFormData extends FieldValues,
  TValue extends SelectValue,
  TName extends FieldPathByValue<TFormData, TValue | null | undefined>,
> = FormAdapterProps<TFormData, TName> &
  Omit<SelectBaseProps<TValue>, "errorMessage"> & {
    /** Кнопка очистки (по умолчанию включена); `false` для обязательных полей. */
    clearable?: boolean;
    onValueChange?: (value: TValue | null) => void;
  };

/** Ветка union-пропсов Select: `null` допустим только с кнопкой очистки. */
const getSingleValueProps = <TValue extends SelectValue>(
  clearable: boolean,
  value: TValue | null | undefined,
) =>
  clearable
    ? { clearable: true as const, value: value ?? null }
    : { clearable: false as const, value: value ?? undefined };

/**
 * Одиночный Select, связанный с RHF: в форму пишется значение опции или
 * `null`; закрытие шторки — blur поля. Для массивов — MultiSelectFormField.
 *
 * @example
 * <SelectFormField<TForm> name={"country"} label={"Страна"} options={options} />
 */
export const SelectFormField = <
  TFormData extends FieldValues,
  TValue extends SelectValue = string,
  TName extends FieldPathByValue<TFormData, TValue | null | undefined> =
    FieldPathByValue<TFormData, TValue | null | undefined>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  clearable = true,
  onValueChange,
  onOpenChange,
  ...selectProps
}: SelectFormFieldProps<TFormData, TValue, TName>) => (
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
        {...getSingleValueProps<TValue>(clearable, field.value)}
        multi={false}
        labelInValue={false}
        disabled={field.disabled}
        errorMessage={fieldState.error?.message}
        onOpenChange={open => {
          if (!open) field.onBlur();
          onOpenChange?.(open);
        }}
        onChange={(next: TValue | null) => {
          field.onChange(next);
          onValueChange?.(next);
        }}
      />
    )}
  />
);
