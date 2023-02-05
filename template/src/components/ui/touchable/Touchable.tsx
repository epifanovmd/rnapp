import React, {FC, memo} from 'react';
import {TouchableOpacity, TouchableOpacityProps} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../../elements';

export interface TouchableProps
  extends FlexComponentProps,
    Omit<TouchableOpacityProps, 'style'> {}

export const Touchable: FC<TouchableProps> = memo(({children, ...rest}) => {
  const {style, ownProps} = useFlexProps(rest);

  return (
    <TouchableOpacity activeOpacity={0.7} style={style} {...ownProps}>
      {children}
    </TouchableOpacity>
  );
});
