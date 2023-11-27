import React, {FC, memo, useMemo} from 'react';
import {Button, ButtonProps} from './Button';
import {useTheme} from '../../../theme';

interface BorderButtonProps extends ButtonProps {}

export const BorderButton: FC<BorderButtonProps> = memo(({color, ...rest}) => {
  const {theme} = useTheme();

  const defaultProps = useMemo(
    () => ({
      borderColor: rest.disabled
        ? theme.color.primary.light
        : theme.color.primary.main,
      borderWidth: 2,
      bg: 'transparent',
      color: color ? color : theme.color.primary.main,
    }),
    [color, rest.disabled, theme.color.primary.light, theme.color.primary.main],
  );

  return <Button {...defaultProps} {...rest} />;
});
