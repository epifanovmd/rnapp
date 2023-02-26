import React, {FC, memo, useCallback} from 'react';
import {TouchableOpacity, TouchableOpacityProps} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../../elements';
import {GestureResponderEvent} from 'react-native/Libraries/Types/CoreEventTypes';

export interface TouchableProps<T>
  extends FlexComponentProps,
    Omit<TouchableOpacityProps, 'style' | 'onPress'> {
  ctx?: T;
  onPress?: (value: T | undefined, event: GestureResponderEvent) => void;
}

interface TouchableFC {
  <T extends any = any>(props: TouchableProps<T>): ReturnType<FC>;
}

export const Touchable: TouchableFC = memo(
  ({onPress, ctx, children, ...rest}) => {
    const {style, ownProps} = useFlexProps(rest);

    const _onPress = useCallback(
      (event: GestureResponderEvent) => {
        onPress?.(ctx, event);
      },
      [ctx, onPress],
    );

    return (
      <TouchableOpacity
        onPress={_onPress}
        activeOpacity={0.7}
        style={style}
        {...ownProps}>
        {children}
      </TouchableOpacity>
    );
  },
);
