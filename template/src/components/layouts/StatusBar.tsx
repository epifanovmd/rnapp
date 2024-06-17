import React, { FC, memo } from "react";
import { StatusBar as RNStatusBar, StatusBarProps } from "react-native";
import { StatusBarStyle } from "react-native/Libraries/Components/StatusBar/StatusBar";

import { useTheme } from "../../theme";

interface IProps extends StatusBarProps {}

export const StatusBar: FC<IProps> = memo(props => {
  const { theme } = useTheme();

  return (
    <RNStatusBar
      barStyle={theme.color.barStyle as StatusBarStyle}
      translucent={false}
      backgroundColor={theme.color.background}
      {...props}
    />
  );
});
