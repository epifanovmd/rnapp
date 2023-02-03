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
} from 'react-native';
import {Placeholder} from '../placeholder';
import {FlexComponentProps, useFlexProps} from '../../elements';
import {useTheme} from '../../../theme';
import {Text} from '../text';

export interface ISearchProps extends FlexComponentProps {
  value?: string;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onChangeText?: (text: string) => void;
  disabled?: boolean;
  isPassword?: boolean;
  placeholder?: string;
}

export const Search: FC<ISearchProps> = forwardRef<TextInput, ISearchProps>(
  (
    {
      value,
      onBlur,
      onFocus,
      isPassword,
      onChangeText,
      placeholder,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const {theme} = useTheme();
    const {style, ownProps} = useFlexProps(rest, {
      radius: 23,
      height: 40,
    });
    const [isActive, setActive] = useState(false);
    const _value = useRef(value);

    useEffect(() => {
      _value.current = value;
    }, [value]);

    const handleFocus = useCallback(
      event => {
        onFocus?.(event);
        setActive(true);
      },
      [onFocus],
    );

    const onFocusHandler = useCallback(() => {
      setActive(true);
    }, []);

    const handleBlur = useCallback(
      event => {
        onBlur?.(event);
        if (!_value.current && !value) {
          setActive(false);
        }
      },
      [onBlur, value],
    );

    const handleChange = useCallback(
      (text: string) => {
        _value.current = text;
        onChangeText && onChangeText(text);
      },
      [onChangeText],
    );

    const icon = useMemo(() => <Text>Search</Text>, []);

    return (
      <Placeholder
        style={style}
        active={isActive}
        onFocus={onFocusHandler}
        leftIcon={icon}
        disabled={disabled}
        {...ownProps}>
        <TextInput
          placeholderTextColor={theme.color.grey.grey900}
          style={styles.input}
          placeholder={placeholder}
          ref={ref}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChange}
          editable={!disabled}
        />
      </Placeholder>
    );
  },
);

const styles = StyleSheet.create({
  input: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
    flexShrink: 1,
  },
  icon: {
    width: 24,
    height: 24,
    marginTop: 4,
  },
});
