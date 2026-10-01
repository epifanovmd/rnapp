import React from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";

import { Col } from "../../flex-view";
import { ISwitchProps, Switch } from "../../switch";
import { Text } from "../../text";
import { Touchable } from "../../touchable";
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
          <Touchable
            row
            alignItems={"center"}
            gap={12}
            bg={"onSurface"}
            radius={16}
            ph={16}
            pv={12}
            minHeight={60}
            disabled={field.disabled}
            opacity={field.disabled ? 0.6 : undefined}
            onPress={() => toggle(!field.value)}
            accessibilityRole={"switch"}
            accessibilityState={{
              checked: Boolean(field.value),
              disabled: field.disabled,
            }}
          >
            <Col flex={1} gap={2}>
              {!!label && <Text textStyle={"Body_M2"}>{label}</Text>}
              {!!description && (
                <Text textStyle={"Caption_M3"} color={"textSecondary"}>
                  {description}
                </Text>
              )}
            </Col>
            <Switch
              {...switchProps}
              accessibilityLabel={label}
              disabled={field.disabled}
              isActive={Boolean(field.value)}
              onChange={toggle}
            />
          </Touchable>
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
