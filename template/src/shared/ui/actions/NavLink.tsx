import {
  RootParamList,
  RouteName,
  useNavigation,
} from "@shared/lib/navigation";
import React, { memo, useCallback } from "react";

import { ITouchableProps, Touchable } from "../touchable";

export interface INavLinkProps<Name extends RouteName> extends ITouchableProps {
  to: Name;
  params?: RootParamList[Name];
}

const NavLinkBase = <Name extends RouteName>({
  children,
  to,
  params,
  ...rest
}: INavLinkProps<Name>) => {
  const navigation = useNavigation();

  // `navigate` типизирован перегрузками на каждый экран — union-вызов по ним
  // не дистрибутируется. Сужаем сигнатуру: безопасность обеспечивает связка
  // `to: Name` + `params: RootParamList[Name]` на пропсах.
  const navigate = navigation.navigate as (
    name: RouteName,
    params?: object,
  ) => void;

  const onPress = useCallback(() => {
    navigate(to, params);
  }, [navigate, to, params]);

  return (
    <Touchable {...rest} onPress={onPress}>
      {children}
    </Touchable>
  );
};

/** Типизированная навигационная ссылка: `<NavLink to="PdfView" params={{ url }} />`. */
export const NavLink = memo(NavLinkBase) as typeof NavLinkBase;
