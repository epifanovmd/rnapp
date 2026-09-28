import { useMergedCallback } from "@shared/lib/hooks";
import { RefObject, useCallback, useEffect, useState } from "react";
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
} from "react-native";

export interface ITextFieldStateOptions {
  value?: string;
  secureTextEntry?: boolean;
  /**
   * Трекать текст локально при uncontrolled-использовании — нужно фичам,
   * читающим значение (hint-right, счётчик, multiline-высота).
   */
  trackLocalValue: boolean;
  inputRef: RefObject<RNTextInput | null>;
  onFocus?: RNTextInputProps["onFocus"];
  onBlur?: RNTextInputProps["onBlur"];
  onChangeText?: (text: string, rawText?: string) => void;
}

/**
 * Состояние текстового поля (SRP: без разметки): фокус, наличие значения,
 * локальное значение для uncontrolled, secure-переключатель, очистка.
 */
export const useTextFieldState = ({
  value,
  secureTextEntry,
  trackLocalValue,
  inputRef,
  onFocus,
  onBlur,
  onChangeText,
}: ITextFieldStateOptions) => {
  const [isFocused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const [localValue, setLocalValue] = useState("");
  const [secure, setSecure] = useState(secureTextEntry);

  const isLocal = value === undefined && trackLocalValue;
  const finalValue = isLocal ? localValue : value;

  useEffect(() => {
    setLocalValue("");
    setHasValue(!!value);
  }, [value]);

  useEffect(() => {
    setSecure(secureTextEntry);
  }, [secureTextEntry]);

  const handleFocus = useMergedCallback(
    onFocus,
    useCallback(() => setFocused(true), []),
  );

  const handleBlur = useMergedCallback(
    onBlur,
    useCallback(() => setFocused(false), []),
  );

  const handleChangeText = useMergedCallback(
    onChangeText,
    useCallback(
      (text: string) => {
        if (isLocal) {
          setLocalValue(text);
        }
        setHasValue(!!text);
      },
      [isLocal],
    ),
  );

  const handleClear = useCallback(() => {
    inputRef.current?.clear();
    handleChangeText?.("");
  }, [inputRef, handleChangeText]);

  const toggleSecure = useCallback(() => setSecure(state => !state), []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  return {
    isFocused,
    hasValue,
    finalValue,
    secure,
    toggleSecure,
    focusInput,
    handleFocus,
    handleBlur,
    handleChangeText,
    handleClear,
  };
};
