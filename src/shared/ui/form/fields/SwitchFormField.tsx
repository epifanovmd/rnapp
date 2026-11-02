import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { Col } from "../../flex-view";
import { ISwitchProps } from "../../switch";
import { SwitchRow } from "../../switch-row";
import { Text } from "../../text";
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

/** Логическое поле формы: плашка с подписью и описанием слева, тумблер справа. */
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
    render={({ field, fieldState }) => {
      const toggle = (value: boolean) => {
        field.onChange(value);
        field.onBlur();

        return onValueChange?.(value);
      };

      return (
        <Col gap={4}>
          {/* Плашка как у TextField: подпись слева, тумблер справа. */}
          <SwitchRow
            bg={"onSurface"}
            radius={16}
            ph={16}
            pv={12}
            minHeight={60}
            label={label}
            description={description}
            value={Boolean(field.value)}
            disabled={field.disabled}
            switchProps={switchProps}
            onValueChange={toggle}
          />
          {!!fieldState.error?.message && (
            <Text textStyle={"Caption_M3"} color={"danger"} mh={16}>
              {fieldState.error.message}
            </Text>
          )}
        </Col>
      );
    }}
  />
);
