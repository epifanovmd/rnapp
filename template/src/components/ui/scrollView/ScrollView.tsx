import React, {FC, memo} from 'react';
import {
  Animated,
  ScrollView as _ScrollView,
  ScrollViewProps as _ScrollViewProps,
} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../flexView';

export interface ScrollViewProps extends FlexComponentProps<_ScrollViewProps> {}

export const ScrollView: FC<ScrollViewProps> = memo(({children, ...rest}) => {
  const {style, ownProps, animated} = useFlexProps(rest);

  const Component = animated ? Animated.ScrollView : _ScrollView;

  return (
    <Component style={style} {...ownProps}>
      {children}
    </Component>
  );
});
