import { ITextProps, Text } from "@components";
import React, { memo } from "react";

export interface INavbarTitleProps extends ITextProps {}

export const NavbarTitle = memo<INavbarTitleProps>(({ style, ...props }) => {
  return (
    <Text numberOfLines={1} style={[{ fontSize: 16 }, style]} {...props} />
  );
});
