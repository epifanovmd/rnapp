import React, {FC, memo} from 'react';
import {
  Animated,
  StyleSheet,
  Text as RNText,
  TextProps,
  TextStyle,
} from 'react-native';
import {Theme, useThemeAwareObject} from '../../../theme';
import {FlexComponentProps, useFlexProps} from '../../elements';

interface IProps extends FlexComponentProps<TextProps, TextStyle> {}

export const Text: FC<IProps> = memo(({children, ...rest}) => {
  const styles = useThemeAwareObject(createStyles);
  const {ownProps, style, animated} = useFlexProps(rest);

  const Component = animated ? Animated.Text : RNText;

  return (
    <Component style={[styles.wrap, style]} {...ownProps}>
      {children}
    </Component>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      color: theme.color.grey.grey900,
    },
  });
