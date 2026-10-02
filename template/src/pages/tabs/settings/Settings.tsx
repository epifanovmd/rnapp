import { Container, Navbar, ScreenScroll } from "@shared/ui";
import { AppMenu } from "@widgets/app-menu";
import { useTabBarHeight } from "@widgets/app-shell";
import React, { FC } from "react";

/** Таб «Настройки»: профиль, разделы аккаунта, тема, биометрия и выход. */
export const Settings: FC = () => {
  const tabBarHeight = useTabBarHeight();

  return (
    <Container edges={["top"]}>
      <Navbar title={"Настройки"} />
      <ScreenScroll bottomInset={tabBarHeight}>
        <AppMenu />
      </ScreenScroll>
    </Container>
  );
};
