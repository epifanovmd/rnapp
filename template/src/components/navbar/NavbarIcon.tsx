import { useTheme } from "@core";
import React, { memo } from "react";
import { StyleSheet } from "react-native";

import { Icon, IIconProps } from "../ui/icon";

export interface INavbarIconProps extends IIconProps {}

export const NavbarIcon = memo<INavbarIconProps>(({ style, ...props }) => {
  const { colors } = useTheme();

  const fill = colors.onSurfaceHigh;

  return <Icon style={[SS.icon, style]} fill={fill} {...props} />;
});

const SS = StyleSheet.create({
  icon: {
    margin: 12,
  },
});
