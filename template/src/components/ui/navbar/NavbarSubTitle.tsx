import { ITextProps, Text } from "@components";
import { useTheme } from "@core";
import React, { memo } from "react";

export interface INavbarSubTitleProps extends ITextProps {}

export const NavbarSubTitle = memo<INavbarSubTitleProps>(
  ({ style, ...props }) => {
    const { theme } = useTheme();

    const color = theme?.color.text;

    return (
      <Text
        style={[{ color, fontSize: 12 }, style]}
        numberOfLines={1}
        {...props}
      />
    );
  },
);
