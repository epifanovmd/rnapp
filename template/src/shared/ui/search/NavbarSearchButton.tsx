import type { ISearchController } from "@shared/lib/search";
import React, { FC } from "react";

import { NavbarIcon } from "../navbar/NavbarIcon";
import { Touchable } from "../touchable";

interface INavbarSearchButtonProps {
  search: ISearchController;
}

/** Кнопка поиска в навбаре: раскрывает поле (`NavbarSearchField`). */
export const NavbarSearchButton: FC<INavbarSearchButtonProps> = ({ search }) => (
  <Touchable
    onPress={search.open}
    hitSlop={8}
    accessibilityRole={"button"}
    accessibilityLabel={"Поиск"}
  >
    <NavbarIcon name={"search"} />
  </Touchable>
);
