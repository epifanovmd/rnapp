import { mergeRefs } from "@force-dev/react";
import React, { ForwardedRef, forwardRef, memo, useRef } from "react";
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
} from "react-native";
import {
  TextInputMask,
  TextInputMaskProps,
  TextInputMaskTypeProp,
} from "react-native-masked-text";

const isMaskedInputProps = (
  props: TextInputMaskProps | RNTextInputProps,
): props is TextInputMaskProps => {
  const isHasType = "type" in props && typeof props.type !== "undefined";

  if (isHasType && props.type === "custom" && !props.options?.mask) {
    // eslint-disable-next-line
    console.warn(
      "[RNVITextInput] When type = custom, options.mask is required!",
    );

    return false;
  }

  return isHasType;
};

export interface TextInputProps
  extends Omit<TextInputMaskProps, "type">,
    RNTextInputProps {
  readonly ref?: ForwardedRef<RNTextInput>;
  readonly type?: TextInputMaskTypeProp;

  onChangeText?(text: string, rawText?: string): void;
}

export const TextInput = memo(
  forwardRef(
    (
      { numberOfLines = 6, multiline, ...rest }: TextInputProps,
      ref: ForwardedRef<RNTextInput>,
    ) => {
      const textInputRef = useRef<RNTextInput>(null);

      if (isMaskedInputProps(rest)) {
        return (
          <TextInputMask
            refInput={mergeRefs([ref, textInputRef])}
            numberOfLines={numberOfLines}
            multiline={multiline}
            {...rest}
          />
        );
      }

      return (
        <RNTextInput
          ref={mergeRefs([ref, textInputRef])}
          numberOfLines={numberOfLines}
          multiline={multiline}
          {...rest}
        />
      );
    },
  ),
);
