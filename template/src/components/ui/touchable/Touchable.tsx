import React, {FC, memo, useCallback} from 'react';
import {TouchableOpacity, TouchableOpacityProps} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../../elements';
import {GestureResponderEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {RequiredKeys} from '@force-dev/utils';

export interface TouchableProps<T>
  extends FlexComponentProps,
    Omit<TouchableOpacityProps, 'style' | 'onPress'> {
  onPress?: (value: T, event: GestureResponderEvent) => void;
  ctx?: T;
}

interface TouchableFC {
  <T extends any = undefined>(
    props: Omit<TouchableProps<T>, 'ctx'> & {ctx?: never},
  ): ReturnType<FC>;
}

interface TouchableContextFC {
  <T extends any = undefined>(
    props: RequiredKeys<TouchableProps<T>, 'ctx'>,
  ): ReturnType<FC>;
}

export const Touchable: TouchableFC = memo(
  ({onPress, ctx, children, ...rest}) => {
    const {style, ownProps} = useFlexProps(rest);

    const _onPress = useCallback(
      (event: GestureResponderEvent) => {
        onPress?.(ctx as any, event);
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

export const TouchableContext = Touchable as TouchableContextFC;
