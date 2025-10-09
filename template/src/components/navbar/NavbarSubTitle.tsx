import React, { memo } from "react";

import { ITextProps, Text } from "../ui";

export interface INavbarSubTitleProps extends ITextProps {}

export const NavbarSubTitle = memo<INavbarSubTitleProps>(props => {
  return <Text numberOfLines={1} textStyle={"Body_S2"} {...props} />;
});
