import { NavigationProp, useNavigation } from "@react-navigation/native";
import { ScreenName } from "@shared/lib/navigation";
import React, { FC, memo, useCallback } from "react";

import { ITouchableProps, Touchable } from "../touchable";

export interface INavLinkProps extends ITouchableProps {
  to: ScreenName;
  screen?: ScreenName;
  params?: { [key in string]: string | number | undefined };
}

export const NavLink: FC<INavLinkProps> = memo(
  ({ children, to, params, screen, ...rest }) => {
    const { navigate } = useNavigation<NavigationProp<object>>();

    // Ссылка динамическая: экран приходит union-строкой, а `navigate`
    // типизирован кортежами перегрузок на каждый экран — union по ним
    // не дистрибутируется. Сужаем сигнатуру: безопасность обеспечивает
    // тип `to: ScreenName` на пропсах.
    const navigateTo = navigate as (name: ScreenName, params?: object) => void;

    const onPress = useCallback(() => {
      navigateTo(
        to,
        screen
          ? {
              screen,
              params,
            }
          : params,
      );
    }, [navigateTo, params, screen, to]);

    return (
      <Touchable {...rest} onPress={onPress}>
        {children}
      </Touchable>
    );
  },
);
