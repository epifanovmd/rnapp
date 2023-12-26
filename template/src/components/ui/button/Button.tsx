import React, {FC, memo} from 'react';
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  ColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {isString} from '@force-dev/utils';
import {
  Touchable,
  TouchableProps,
  RenderConditional,
  Text,
  Row,
} from '@force-dev/react-mobile';

export interface ButtonProps extends TouchableProps {
  loading?: boolean;
  leftSlot?: React.JSX.Element;
  title: React.JSX.Element | string;
  rightSlot?: React.JSX.Element;
  color?: ColorValue;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  indicatorProps?: ActivityIndicatorProps;
}

export const Button: FC<ButtonProps> = memo(
  ({
    loading,
    leftSlot,
    title,
    rightSlot,
    color = '#fff',
    contentStyle,
    textStyle,
    indicatorProps,
    ...rest
  }) => {
    return (
      <Touchable
        activeOpacity={0.7}
        delayPressIn={100}
        radius={4}
        row={true}
        bg={'#1c3e94'}
        justifyContent={'center'}
        alignItems={'center'}
        overflow={'hidden'}
        pa={8}
        {...rest}
        disabled={rest.disabled || loading}>
        <RenderConditional if={!!loading}>
          <ActivityIndicator size="small" color={color} {...indicatorProps} />
        </RenderConditional>

        <RenderConditional if={!loading}>
          <Row alignItems={'center'} style={contentStyle}>
            {leftSlot}

            {isString(title) ? (
              <Text
                text={title}
                lineBreakMode={'tail'}
                color={color}
                style={textStyle}
              />
            ) : (
              title
            )}

            {rightSlot}
          </Row>
        </RenderConditional>
      </Touchable>
    );
  },
);
