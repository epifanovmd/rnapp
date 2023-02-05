import * as React from 'react';
import {FC} from 'react';
import {Animated, View} from 'react-native';
import {useFlexProps} from './useFlexProps';
import {FlexComponentProps} from './types';

export const FlexView: FC<FlexComponentProps> = props => {
  const {ownProps, style, animated} = useFlexProps(props);

  const Component = animated ? Animated.View : View;

  return <Component style={style} {...ownProps} />;
};

export const Col = (props: FlexComponentProps) => (
  <FlexView col={true} {...props} />
);
export const Row = (props: FlexComponentProps) => (
  <FlexView row={true} {...props} />
);
