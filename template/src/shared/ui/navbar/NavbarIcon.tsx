import { useTheme } from "@shared/lib/theme";
import React, { memo } from "react";
import { StyleSheet } from "react-native";

import { Icon, IIconProps } from "../icon";

export interface INavbarIconProps extends IIconProps {}

export const NavbarIcon = memo<INavbarIconProps>(({ style, ...props }) => {
  const { colors } = useTheme();

  return (
    <Icon style={[SS.icon, style]} color={colors.textPrimary} {...props} />
  );
});

const SS = StyleSheet.create({
  icon: {
    margin: 12,
  },
});
