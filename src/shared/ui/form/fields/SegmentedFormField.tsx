import React from "react";
import { FieldPath, FieldValues } from "react-hook-form";

import { Field } from "../../field";
import { ISegmentedProps, Segmented } from "../../segmented";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type SegmentedFormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData>,
  V extends string = string,
> = FormAdapterProps<TFormData, TName> &
  Omit<ISegmentedProps<V>, "value" | "onValueChange"> & {
    label?: string;
    description?: string;
    onValueChange?: (value: V) => void;
  };

/** Сегментированный выбор RHF; описание выбранного варианта — под полем. */
export const SegmentedFormField = <
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData> = FieldPath<TFormData>,
  V extends string = string,
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
  options,
  ...segmentedProps
}: SegmentedFormFieldProps<TFormData, TName, V>) => (
  <FormField
    name={name}
    control={control}
    rules={rules}
    shouldUnregister={shouldUnregister}
    defaultValue={defaultValue}
    disabled={disabled}
    render={({ field, fieldState }) => {
      const selected = options.find(option => option.value === field.value);
      const hint =
        typeof selected?.description === "string"
          ? selected.description
          : description;

      return (
        <Field
          label={label}
          description={hint}
          error={fieldState.error?.message}
          disabled
        >
          <Segmented<V>
            {...segmentedProps}
            options={options}
            disabled={field.disabled}
            value={field.value}
            onValueChange={next => {
              field.onChange(next);
              onValueChange?.(next);
            }}
          />
        </Field>
      );
    }}
  />
);
