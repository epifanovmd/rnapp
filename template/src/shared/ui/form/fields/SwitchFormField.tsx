import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { Field } from "../../field";
import { ISwitchProps, Switch } from "../../switch";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type SwitchFormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, boolean | undefined>,
> = FormAdapterProps<TFormData, TName> &
  Omit<ISwitchProps, "children" | "disabled" | "isActive" | "onChange"> & {
    label?: string;
    description?: string;
    onValueChange?: (value: boolean) => void | Promise<unknown>;
  };

/** Переключатель логического поля с общей обёрткой и ошибкой. */
export const SwitchFormField = <
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
  ...switchProps
}: SwitchFormFieldProps<TFormData, TName>) => (
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
        <Switch
          {...switchProps}
          accessibilityLabel={label}
          disabled={field.disabled}
          isActive={Boolean(field.value)}
          onChange={value => {
            field.onChange(value);
            field.onBlur();

            return onValueChange?.(value);
          }}
        />
      </Field>
    )}
  />
);
