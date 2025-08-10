import { ScreenName } from "@navigation";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import React, { FC, memo, useCallback } from "react";

import { ITouchableProps, Touchable } from "../ui";

export interface INavLinkProps extends ITouchableProps {
  to: ScreenName;
  screen?: ScreenName;
  params?: { [key in string]: string | number | undefined };
}

export const NavLink: FC<INavLinkProps> = memo(
  ({ children, to, params, screen, ...rest }) => {
    const { navigate } = useNavigation<NavigationProp<any>>();

    const onPress = useCallback(() => {
      navigate(
        to,
        screen
          ? {
              screen,
              params,
            }
          : params,
      );
    }, [navigate, params, screen, to]);

    return (
      <Touchable {...rest} onPress={onPress}>
        {children}
      </Touchable>
    );
  },
);
