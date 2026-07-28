import { useTheme } from "@shared/lib/theme";
import React, { memo } from "react";
import { StyleSheet } from "react-native";

import { Icon, IIconProps } from "../icon/index";

export interface INavbarIconProps extends IIconProps {}

export const NavbarIcon = memo<INavbarIconProps>(({ style, ...props }) => {
  const { colors } = useTheme();

  const fill = colors.textPrimary;

  return <Icon style={[SS.icon, style]} fill={fill} {...props} />;
});

const SS = StyleSheet.create({
  icon: {
    margin: 12,
  },
});
