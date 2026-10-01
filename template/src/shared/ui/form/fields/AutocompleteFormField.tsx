import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { Autocomplete, AutocompleteProps } from "../../select";
import { FormField } from "../primitives";
import { FormAdapterProps } from "../types";

export type AutocompleteFormFieldProps<
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, string | null | undefined>,
> = FormAdapterProps<TFormData, TName> &
  Omit<AutocompleteProps, "value" | "onChange" | "errorMessage"> & {
    onValueChange?: (value: string) => void;
  };

/**
 * Autocomplete, связанный с RHF: в форму пишется текст поля; закрытие
 * шторки — blur поля.
 *
 * @example
 * <AutocompleteFormField<TForm> name={"city"} label={"Город"} options={options} />
 */
export const AutocompleteFormField = <
  TFormData extends FieldValues,
  TName extends FieldPathByValue<TFormData, string | null | undefined> =
    FieldPathByValue<TFormData, string | null | undefined>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  onValueChange,
  onOpenChange,
  ...autocompleteProps
}: AutocompleteFormFieldProps<TFormData, TName>) => (
  <FormField
    name={name}
    control={control}
    rules={rules}
    shouldUnregister={shouldUnregister}
    defaultValue={defaultValue}
    disabled={disabled}
    render={({ field, fieldState }) => (
      <Autocomplete
        {...autocompleteProps}
        value={String(field.value ?? "")}
        disabled={field.disabled}
        errorMessage={fieldState.error?.message}
        onOpenChange={open => {
          if (!open) field.onBlur();
          onOpenChange?.(open);
        }}
        onChange={next => {
          field.onChange(next);
          onValueChange?.(next);
        }}
      />
    )}
  />
);
