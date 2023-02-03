import React, {FC, memo, useMemo} from 'react';
import {TextStyle, TouchableOpacityProps} from 'react-native';
import {FlexComponentProps, useFlexProps} from '../../elements';
import {Button} from './Button';
import {useTheme} from '../../../theme';

interface IProps extends FlexComponentProps<TouchableOpacityProps> {
  loading?: boolean;
  title: string;
  fontSize?: number;
  textStyle?: TextStyle;
}

export const BorderButton: FC<IProps> = memo(({title, color, ...rest}) => {
  const {theme} = useTheme();
  const {style, ownProps} = useFlexProps(rest, {
    borderColor: rest.disabled
      ? theme.color.primary.light
      : theme.color.primary.main,
    borderWidth: 2,
    bg: theme.color.common.white,
  });

  const buttonColor = useMemo(
    () =>
      color
        ? color
        : rest.disabled
        ? theme.color.primary.light
        : theme.color.primary.main,
    [color, rest.disabled, theme.color.primary.light, theme.color.primary.main],
  );

  return (
    <Button title={title} style={style} color={buttonColor} {...ownProps} />
  );
});
