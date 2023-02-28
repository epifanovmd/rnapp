import React, {
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
} from 'react-native';
import {Placeholder} from '../placeholder';
import {FlexComponentProps, useFlexProps} from '../../elements';
import {Touchable} from '../touchable';
import {Text} from '../text';

export interface IInputProps extends FlexComponentProps {
  name?: string;
  value?: string;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onChangeText?: (text: string) => void;
  disabled?: boolean;
  isPassword?: boolean;
  placeholder?: string;
  textInputProps?: TextInputProps;

  setFieldValue?: (name: any, value: string) => void;
  setFieldBlur?: (name: string) => void;
}

export const Input: FC<IInputProps> = forwardRef<TextInput, IInputProps>(
  (
    {
      name,
      value,
      onBlur,
      onFocus,
      isPassword,
      onChangeText,
      placeholder,
      disabled,
      textInputProps,
      setFieldValue,
      setFieldBlur,
      ...rest
    },
    ref,
  ) => {
    const {style, ownProps} = useFlexProps(rest);
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [isActive, setActive] = useState(!!value);
    const _value = useRef(value);

    useEffect(() => {
      _value.current = value;
      if (value) {
        setActive(true);
      }
    }, [value]);

    const handleFocus = useCallback(
      (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
        onFocus?.(event);
        setActive(true);
      },
      [onFocus],
    );

    const onFocusHandler = useCallback(() => {
      setActive(true);
    }, []);

    const handleBlur = useCallback(
      (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
        onBlur?.(event);
        name && setFieldBlur && setFieldBlur(name);
        if (!_value.current && !value) {
          setActive(false);
        }
      },
      [name, onBlur, setFieldBlur, value],
    );

    const handleChange = useCallback(
      (text: string) => {
        _value.current = text;
        onChangeText && onChangeText(text);
        name && setFieldValue && setFieldValue(name, text);
      },
      [name, onChangeText, setFieldValue],
    );

    const visibilityOn = useCallback(() => {
      setSecureTextEntry(true);
    }, []);
    const visibilityOff = useCallback(() => {
      setSecureTextEntry(false);
    }, []);

    const icon = useMemo(
      () =>
        isPassword ? (
          secureTextEntry ? (
            <Touchable pa={16} disabled={disabled} onPress={visibilityOff}>
              <Text>Icon</Text>
            </Touchable>
          ) : (
            <Touchable pa={16} disabled={disabled} onPress={visibilityOn}>
              <Text>Icon</Text>
            </Touchable>
          )
        ) : null,
      [disabled, isPassword, secureTextEntry, visibilityOff, visibilityOn],
    );

    return (
      <Placeholder
        style={style}
        active={isActive}
        onFocus={onFocusHandler}
        rightIcon={icon}
        placeholder={placeholder}
        disabled={disabled}
        {...ownProps}>
        <TextInput
          style={[styles.input, {paddingRight: icon ? 48 : 16}]}
          ref={ref}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChange}
          editable={!disabled}
          textContentType={isPassword ? 'password' : 'none'}
          secureTextEntry={isPassword && secureTextEntry}
          {...textInputProps}
        />
      </Placeholder>
    );
  },
);

const styles = StyleSheet.create({
  input: {
    height: '100%',
    flexGrow: 1,
    paddingHorizontal: 16,
  },
});
