import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { StatusBar as RNStatusBar, StatusBarProps } from "react-native";

interface IProps extends StatusBarProps {}

/**
 * Тем-зависимый StatusBar; единственная точка управления barStyle.
 * backgroundColor/translucent не задаются — Android живёт в edge-to-edge.
 */
export const StatusBar: FC<IProps> = memo(props => {
  const { isLight } = useTheme();

  return (
    <RNStatusBar
      barStyle={isLight ? "dark-content" : "light-content"}
      animated={true}
      {...props}
    />
  );
});
