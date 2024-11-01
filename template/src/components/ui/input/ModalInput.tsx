import { useBottomSheetInternal } from "@force-dev/react-mobile";
import React, {
  forwardRef,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
} from "react";
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
} from "react-native";

import { Input, InputProps } from "./Input";

export interface IModalInputProps extends InputProps {}

const _ModalInput = forwardRef<TextInput, PropsWithChildren<IModalInputProps>>(
  (props, ref) => {
    const { shouldHandleKeyboardEvents } = useBottomSheetInternal();

    useEffect(() => {
      return () => {
        // Reset the flag on unmount
        shouldHandleKeyboardEvents.value = false;
      };
    }, [shouldHandleKeyboardEvents]);

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        shouldHandleKeyboardEvents.value = true;
        props.onFocus?.(e);
      },
      [props, shouldHandleKeyboardEvents],
    );

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        shouldHandleKeyboardEvents.value = false;
        props.onBlur?.(e);
      },
      [props, shouldHandleKeyboardEvents],
    );

    return (
      <Input ref={ref} {...props} onFocus={handleFocus} onBlur={handleBlur} />
    );
  },
);

export const ModalInput = memo(_ModalInput);
