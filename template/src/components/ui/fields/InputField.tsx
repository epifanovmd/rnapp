import { createSlot, mergeRefs, useSlotProps } from "@force-dev/react";
import { useModalRef } from "@force-dev/react-mobile";
import React, {
  FC,
  forwardRef,
  memo,
  PropsWithChildren,
  RefAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColorValue,
  GestureResponderEvent,
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
} from "react-native";

import { CloseIcon } from "../../icons";
import { Field, FieldProps, FieldSlots } from "../field";
import { Input, InputProps } from "../input";

interface InputFieldProps extends FieldProps {}

const InputSlot = createSlot<InputProps>("Input");

export interface InputFieldSlots extends FieldSlots {
  Input: typeof InputSlot;
}

const _InputField: FC<
  PropsWithChildren<InputFieldProps & RefAttributes<TextInput>>
> = memo(
  forwardRef(({ children, onPress, ...rest }, ref) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setFocused] = useState(false);

    const {
      input,
      leftIcon,
      label,
      content,
      contentValue,
      rightIcon,
      description,
      error,
    } = useSlotProps(InputField, children);

    const modalRef = useModalRef();

    const handlePress = useCallback(
      (value: any, e: GestureResponderEvent) => {
        setFocused(true);
        inputRef.current?.focus();
        modalRef.current?.present();
        onPress?.(e, value);
      },
      [modalRef, onPress],
    );

    const mergedRef = useMemo(() => mergeRefs([ref, inputRef]), [ref]);
    const disabled = rest.disabled || input?.disabled;

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        input?.onFocus?.(e);
        setFocused(true);
      },
      [input],
    );

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        input?.onBlur?.(e);
        setFocused(false);
      },
      [input],
    );

    return (
      <Field {...rest} onPress={handlePress}>
        <Field.Label {...label} />
        <Field.LeftIcon {...leftIcon} />
        <Field.Content {...content}>
          {(!!input?.value || isFocused) && (
            <Input
              ref={mergedRef}
              {...input}
              autoFocus={isFocused && !input?.value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              pointerEvents={disabled ? "none" : undefined}
              disabled={disabled}
              containerStyle={{
                width: "100%",
                padding: 0,
                paddingTop: 0,
                paddingBottom: 0,
              }}
            />
          )}
        </Field.Content>
        <Field.ContentValue {...contentValue} />
        <Field.RightIcon {...rightIcon} />
        <Field.Error color={"red"} {...error} />
        <Field.Description {...description} />
      </Field>
    );
  }),
);

export const InputField = _InputField as typeof _InputField & InputFieldSlots;

InputField.Input = InputSlot;

InputField.Label = Field.Label;
InputField.LeftIcon = Field.LeftIcon;
InputField.RightIcon = Field.RightIcon;
InputField.Content = Field.Content;
InputField.ContentValue = Field.ContentValue;
InputField.Description = Field.Description;
InputField.Error = Field.Error;

const _renderCloseIcon = (fill?: ColorValue) => <CloseIcon fill={fill} />;
