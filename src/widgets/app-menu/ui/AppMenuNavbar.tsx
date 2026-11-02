import type { IScrollReveal } from "@shared/lib/scroll-reveal";
import { Navbar, NavbarReveal } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { useMenuProfile } from "../model/useMenuProfile";
import { AppMenuProfileCompact } from "./AppMenuProfileCompact";

interface IAppMenuNavbarProps {
  /** Заголовок вкладки, пока карточка профиля видна. */
  title: string;
  /** Контроллер перехода — тот же, что у `AppMenu`. */
  reveal: IScrollReveal;
}

/**
 * Навбар вкладки меню: заголовок, а когда карточка профиля уходит под него —
 * компактный профиль; тап по нему — к началу меню.
 */
export const AppMenuNavbar: FC<IAppMenuNavbarProps> = observer(
  ({ title, reveal }) => {
    const profile = useMenuProfile();

    return (
      <Navbar>
        <Navbar.Content>
          <NavbarReveal
            progress={reveal.progress}
            fallbackTitle={title}
            onPress={reveal.scrollToTop}
          >
            <AppMenuProfileCompact {...profile} />
          </NavbarReveal>
        </Navbar.Content>
      </Navbar>
    );
  },
);
