import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { Checkbox, CheckboxProps } from "../../check-box";
import { Field } from "../../field";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type CheckboxFormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, boolean | undefined>,
> = FormAdapterProps<TFormData, TName> &
  Omit<CheckboxProps, "children" | "disabled" | "isActive" | "onChange"> & {
    label?: string;
    description?: string;
    onValueChange?: (value: boolean) => void;
  };

/** Флажок логического поля с общей обёрткой и ошибкой. */
export const CheckboxFormField = <
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, boolean | undefined> =
    FieldPathByValue<TFormData, boolean | undefined>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  label,
  description,
  onValueChange,
  ...checkboxProps
}: CheckboxFormFieldProps<TFormData, TName>) => (
  <FormField
    name={name}
    control={control}
    rules={rules}
    shouldUnregister={shouldUnregister}
    defaultValue={defaultValue}
    disabled={disabled}
    render={({ field, fieldState }) => (
      <Field
        label={label}
        description={description}
        error={fieldState.error?.message}
      >
        <Checkbox
          {...checkboxProps}
          accessibilityLabel={label}
          disabled={field.disabled}
          isActive={Boolean(field.value)}
          onChange={value => {
            field.onChange(value);
            field.onBlur();
            onValueChange?.(value);
          }}
        />
      </Field>
    )}
  />
);
