import { ITextProps, Text } from "@components";
import React, { memo } from "react";

export interface INavbarTitleProps extends ITextProps {}

export const NavbarTitle = memo<INavbarTitleProps>(props => {
  return <Text numberOfLines={1} textStyle={"Title_M"} {...props} />;
});
