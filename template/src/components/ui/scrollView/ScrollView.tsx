import React, {FC, memo} from 'react';
import {
  ScrollView as _ScrollView,
  ScrollViewProps as _ScrollViewProps,
} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../../elements';

export interface ScrollViewProps extends FlexComponentProps<_ScrollViewProps> {}

export const ScrollView: FC<ScrollViewProps> = memo(({children, ...rest}) => {
  const {style, ownProps} = useFlexProps(rest);

  return (
    <_ScrollView style={style} {...ownProps}>
      {children}
    </_ScrollView>
  );
});
