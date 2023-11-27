import React, {FC, memo, useEffect, useMemo, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  ColorValue,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import {Text} from '../text';
import {Col, FlexComponentProps, Row, useFlexProps} from '../flexView';
import {Touchable} from '../touchable';
import {useTheme} from '../../../theme';
import {isString} from 'lodash';

type ButtonType = 'small' | 'middle' | 'large';

const sizes: {
  [key in ButtonType]: TextStyle;
} = {
  large: {
    fontSize: 12,
    height: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  middle: {
    fontSize: 12,
    height: 28,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  small: {
    fontSize: 10,
    height: 22,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
};

export interface ButtonProps extends FlexComponentProps<TouchableOpacityProps> {
  loading?: boolean;
  icon?: JSX.Element;
  title: JSX.Element | string;
  color?: ColorValue;
  size?: ButtonType;
}

export const Button: FC<ButtonProps> = memo(
  ({loading, title, icon, size, color, ...rest}) => {
    const {theme} = useTheme();
    const {style, ownProps} = useFlexProps(rest, {
      radius: 4,
      row: true,
      bg:
        rest.disabled || loading
          ? theme.color.primary.light
          : theme.color.primary.main,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    });

    const buttonSizeStyle = useMemo(() => sizes[size || 'middle'], [size]);

    const animated = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (loading) {
        Animated.timing(animated, {
          duration: 300,
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(animated, {
          duration: 300,
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const buttonColor = useMemo(
      () => (color ? color : theme.color.primary.contrastText),
      [color, theme.color.primary.contrastText],
    );

    const textStyle = useRef({
      transform: [
        {
          scale: animated.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.7],
          }),
        },
        {
          translateX: animated.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -24],
          }),
        },
      ],
    }).current;

    const loadingStyle = useRef({
      transform: [
        {translateX: -8},
        {
          scale: animated.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ],
      opacity: animated.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    }).current;

    const _style = useMemo(
      () => ({...style, ...buttonSizeStyle}),
      [style, buttonSizeStyle],
    );

    return (
      <Touchable
        activeOpacity={0.7}
        delayPressIn={100}
        style={_style}
        {...ownProps}
        disabled={ownProps.disabled || loading}>
        <Animated.View style={textStyle}>
          <Row alignItems={'center'}>
            {icon ? (
              <Col marginRight={buttonSizeStyle.paddingVertical}>{icon}</Col>
            ) : null}
            {isString(title) ? (
              <Text
                lineBreakMode={'tail'}
                fontSize={buttonSizeStyle.fontSize}
                fontWeight={'bold'}
                color={buttonColor}
                textTransform={'uppercase'}>
                {title}
              </Text>
            ) : (
              title
            )}
          </Row>
        </Animated.View>

        <Col width={0}>
          <Animated.View style={loadingStyle}>
            <ActivityIndicator
              size="small"
              color={buttonColor || theme.color.primary.main}
            />
          </Animated.View>
        </Col>
      </Touchable>
    );
  },
);
