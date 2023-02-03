import React, {FC, memo} from 'react';
import {SafeAreaView} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../../elements';

interface IProps extends FlexComponentProps {}

export const SafeArea: FC<IProps> = memo(({children, ...rest}) => {
  const {style, ownProps} = useFlexProps(rest, {
    flexGrow: 1,
  });

  return (
    <SafeAreaView style={style} {...ownProps}>
      {children}
    </SafeAreaView>
  );
});
