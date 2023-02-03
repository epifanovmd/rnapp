import React, {FC, useEffect, useMemo, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';
import {Text} from '../text';
import {Col, FlexComponentProps, FlexView, useFlexProps} from '../../elements';
import {Touchable} from '../touchable';
import {useTheme} from '../../../theme';

interface IProps extends FlexComponentProps {
  active?: boolean;
  placeholder?: string;
  disabled?: boolean;
  leftIcon?: JSX.Element | null;
  rightIcon?: JSX.Element | null;
  onFocus: () => void;
}

export const Placeholder: FC<IProps> = ({
  active,
  placeholder,
  disabled,
  children,
  leftIcon,
  rightIcon,
  onFocus,
  ...rest
}) => {
  const {theme} = useTheme();
  const {style, ownProps} = useFlexProps(rest, {
    borderWidth: 1,
    height: 56,
    bg: theme.color.common.white,
    radius: 4,
    flexGrow: 1,
    flexShrink: 1,
  });
  const position = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    if (active) {
      Animated.timing(position, {
        duration: 100,
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(position, {
        duration: 100,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const placeholderActiveStyle = useMemo(
    () => ({
      fontSize: active ? 12 : 16,
      color: disabled
        ? theme.color.grey.grey200
        : active
        ? theme.color.grey.grey500
        : theme.color.grey.grey900,
    }),
    [
      active,
      disabled,
      theme.color.grey.grey200,
      theme.color.grey.grey500,
      theme.color.grey.grey900,
    ],
  );

  return (
    <Touchable
      onPress={onFocus}
      borderColor={theme.color.grey.grey700}
      style={style}
      disabled={disabled}
      row={true}
      justifyContent={'space-around'}
      alignItems={'center'}
      {...ownProps}>
      {!!placeholder && (
        <Animated.View
          style={{
            transform: [
              {
                translateY: position.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -28],
                }),
              },
            ],
            ...styles.titleStyles,
          }}>
          <>
            <Text
              zIndex={1}
              ellipsizeMode={'tail'}
              style={placeholderActiveStyle}>
              {placeholder}
            </Text>

            <Text
              bg={theme.color.common.white}
              color={theme.color.grey.grey900}
              height={3}
              zIndex={0}
              absolute={true}>
              {placeholder}
            </Text>
          </>
        </Animated.View>
      )}
      {leftIcon && (
        <>
          <FlexView
            alignItems={'center'}
            justify-content={'center'}
            marginLeft={'auto'}
            flexBasis={0}
            left={0}
            absolute={true}>
            {leftIcon}
          </FlexView>
          <Col width={32} />
        </>
      )}
      {children}
      {rightIcon && (
        <>
          <Col width={32} />
          <FlexView
            alignItems={'center'}
            justify-content={'center'}
            marginLeft={'auto'}
            flexBasis={0}
            right={0}
            absolute={true}>
            {rightIcon}
          </FlexView>
        </>
      )}
    </Touchable>
  );
};

const styles = StyleSheet.create({
  titleStyles: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
