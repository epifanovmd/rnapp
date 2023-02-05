import React, {FC, memo, PropsWithChildren, useCallback, useMemo} from 'react';
import CheckBoxRn from '@react-native-community/checkbox';
import {Platform, ViewStyle} from 'react-native';
import {useTheme} from '../../../theme';
import {Row} from '../../elements';
import {Touchable} from '../touchable';
import {Text} from '../text';
import {ComponentProps} from '../../../common';

interface ICheckboxProps extends Omit<ComponentProps<CheckBoxRn>, 'onChange'> {
  style?: ViewStyle;
  disabled?: boolean;
  value?: boolean;
  name?: string;
  setFieldValue?: (name: string, value: boolean) => void;
  onChange?: (value: boolean) => void;
  label?: string;
  radioMode?: boolean;
}

export const Checkbox: FC<PropsWithChildren<ICheckboxProps>> = memo(
  ({
    disabled,
    value,
    onChange,
    setFieldValue,
    name,
    style,
    label,
    children,
    radioMode,
    ...rest
  }) => {
    const {theme} = useTheme();
    const handleChange = useCallback(
      (val: boolean) => {
        if (name) {
          setFieldValue && setFieldValue(name, val);
        }
        onChange && onChange(val);
      },
      [name, onChange, setFieldValue],
    );

    const onPress = useCallback(() => {
      if (name) {
        setFieldValue && setFieldValue(name, !value);
      }
      onChange && onChange(!value);
    }, [name, onChange, setFieldValue, value]);

    const tintColors = useMemo(
      () =>
        disabled
          ? {
              true: theme.color.primary.light,
              false: theme.color.primary.light,
            }
          : {
              true: theme.color.primary.main,
              false: theme.color.primary.main,
            },
      [disabled, theme.color.primary.light, theme.color.primary.main],
    );

    return (
      <Row mv={4} alignItems={'center'}>
        <CheckBoxRn
          {...rest}
          style={[
            style,
            {
              transform: [
                {scale: Platform.OS === 'ios' ? 0.7 : 1},
                {translateY: Platform.OS === 'ios' ? 5 : 0},
              ],
            },
          ]}
          boxType={'square'}
          disabled={radioMode ? disabled || value : disabled}
          tintColors={tintColors}
          value={value}
          onValueChange={handleChange}
          tintColor={
            disabled ? theme.color.primary.main : theme.color.primary.main
          }
          onTintColor={
            disabled ? theme.color.primary.main : theme.color.primary.main
          }
          onCheckColor={
            disabled ? theme.color.primary.main : theme.color.primary.main
          }
          animationDuration={0.00001}
        />
        {(label || children) && (
          <Touchable
            ml={4}
            flexShrink={1}
            flexGrow={1}
            alignItems={'flex-start'}
            activeOpacity={0.7}
            delayPressIn={100}
            onPress={
              (radioMode ? disabled || value : disabled) ? undefined : onPress
            }>
            <Text>{label || children}</Text>
          </Touchable>
        )}
      </Row>
    );
  },
);
