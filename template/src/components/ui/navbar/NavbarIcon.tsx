import { useTheme } from "@theme";
import React, { memo } from "react";
import { StyleSheet } from "react-native";

import { Icon, IIconProps } from "../icon";

export interface INavbarIconProps extends IIconProps {}

export const NavbarIcon = memo<INavbarIconProps>(({ style, ...props }) => {
  const { theme } = useTheme();

  const fill = theme?.color.text;

  return <Icon style={[SS.icon, style]} fill={fill} {...props} />;
});

const SS = StyleSheet.create({
  icon: {
    margin: 12,
  },
});
