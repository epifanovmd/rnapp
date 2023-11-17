import React, {FC, memo, useMemo} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FlexComponentProps, useFlexProps} from '../../elements';
import {View} from 'react-native';

interface IProps extends FlexComponentProps {}

export const SafeArea: FC<IProps> = memo(({children, ...rest}) => {
  const {style, ownProps} = useFlexProps(rest, {
    flexGrow: 1,
  });

  const {...insets} = useSafeAreaInsets();

  const _style = useMemo(
    () => ({
      ...style,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }),
    [insets.bottom, insets.left, insets.right, insets.top, style],
  );

  return (
    <View style={_style} {...ownProps}>
      {children}
    </View>
  );
});
