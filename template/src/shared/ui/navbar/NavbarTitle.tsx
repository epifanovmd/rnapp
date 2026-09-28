import React, { memo } from "react";

import { ITextProps, Text } from "../text";

export interface INavbarTitleProps extends ITextProps {}

export const NavbarTitle = memo<INavbarTitleProps>(props => {
  return <Text numberOfLines={1} textStyle={"Title_M"} {...props} />;
});
