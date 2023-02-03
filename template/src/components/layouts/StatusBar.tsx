import React, {FC, memo} from 'react';
import {StatusBar as RNStatusBar, StatusBarProps} from 'react-native';
import {useTheme} from '../../theme';

interface IProps extends StatusBarProps {}

export const StatusBar: FC<IProps> = memo(props => {
  const {theme} = useTheme();

  return (
    <RNStatusBar
      translucent={false}
      backgroundColor={theme.color.grey.grey200}
      {...props}
    />
  );
});
