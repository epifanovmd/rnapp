import * as React from 'react';
import {FC} from 'react';
import {Animated, View, ViewProps} from 'react-native';
import {useFlexProps} from './useFlexProps';
import {FlexComponentProps} from './types';

export const FlexView: FC<FlexComponentProps<ViewProps>> = props => {
  const {ownProps, style, animated} = useFlexProps(props);

  const Component = animated ? Animated.View : View;

  return <Component style={style} {...ownProps} />;
};

export const Col: FC<FlexComponentProps<ViewProps>> = props => (
  <FlexView col={true} {...props} />
);
export const Row: FC<FlexComponentProps<ViewProps>> = props => (
  <FlexView row={true} {...props} />
);
