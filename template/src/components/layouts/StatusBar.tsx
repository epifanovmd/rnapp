import { useTheme } from "@core";
import React, { FC, memo } from "react";
import { StatusBar as RNStatusBar, StatusBarProps } from "react-native";
import { StatusBarStyle } from "react-native/Libraries/Components/StatusBar/StatusBar";

interface IProps extends StatusBarProps {}

export const StatusBar: FC<IProps> = memo(props => {
  const { colors, isLight } = useTheme();

  return (
    <RNStatusBar
      barStyle={isLight ? "dark-content" : "light-content"}
      translucent={false}
      backgroundColor={colors.background}
      {...props}
    />
  );
});
