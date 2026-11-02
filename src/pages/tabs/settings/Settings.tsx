import { useScrollReveal } from "@shared/lib/scroll-reveal";
import { Container, ScreenScroll } from "@shared/ui";
import { AppMenu, AppMenuNavbar } from "@widgets/app-menu";
import { useTabBarHeight } from "@widgets/app-shell";
import React, { FC } from "react";

/**
 * Таб «Настройки»: профиль, разделы аккаунта, тема, биометрия и выход.
 * Карточка профиля при прокрутке переходит в навбар.
 */
export const Settings: FC = () => {
  const tabBarHeight = useTabBarHeight();
  const reveal = useScrollReveal();

  return (
    <Container edges={["top"]}>
      <AppMenuNavbar title={"Настройки"} reveal={reveal} />
      <ScreenScroll bottomInset={tabBarHeight}>
        <AppMenu reveal={reveal} />
      </ScreenScroll>
    </Container>
  );
};
