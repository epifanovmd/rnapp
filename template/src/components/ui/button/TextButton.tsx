import React, {FC, memo, useMemo} from 'react';
import {Button, ButtonProps} from './Button';
import {useTheme} from '../../../theme';

interface TextButtonProps extends ButtonProps {}

export const TextButton: FC<TextButtonProps> = memo(({color, ...rest}) => {
  const {theme} = useTheme();

  const defaultProps = useMemo(
    () => ({
      borderColor: 'transparent',
      borderWidth: 0,
      bg: 'transparent',
      color: color ? color : theme.color.primary.main,
    }),
    [color, theme.color.primary.main],
  );

  return <Button {...defaultProps} {...rest} />;
});
