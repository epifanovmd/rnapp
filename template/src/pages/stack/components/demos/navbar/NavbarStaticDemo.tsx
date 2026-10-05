import { IconButton, Navbar, ScreenScroll } from "@shared/ui";
import React, { FC, memo } from "react";

import { DemoSection } from "../DemoSection";

/** Витрина статичного Navbar: заголовок, подзаголовок, кнопки и оформление. */
export const NavbarStaticDemo: FC = memo(() => (
  <ScreenScroll gap={24}>
    <DemoSection title={"Заголовок"} description={"title — по центру строки"}>
      <Navbar title={"Профиль"} background={"surface"} bottomRadius={16} />
    </DemoSection>

    <DemoSection
      title={"Заголовок и подзаголовок"}
      description={"Navbar.Title / Navbar.Subtitle"}
    >
      <Navbar background={"surface"} bottomRadius={16}>
        <Navbar.Title>{"Анна Смирнова"}</Navbar.Title>
        <Navbar.Subtitle color={"textSecondary"}>{"в сети"}</Navbar.Subtitle>
      </Navbar>
    </DemoSection>

    <DemoSection
      title={"Назад и действия"}
      description={"Navbar.BackButton слева, Navbar.Right — кнопки справа"}
    >
      <Navbar title={"Документ"} background={"surface"} bottomRadius={16}>
        <Navbar.BackButton />
        <Navbar.Right>
          <IconButton name={"search"} accessibilityLabel={"Поиск"} pa={12} />
          <IconButton
            name={"moreVertical"}
            accessibilityLabel={"Действия"}
            pa={12}
          />
        </Navbar.Right>
      </Navbar>
    </DemoSection>

    <DemoSection
      title={"Произвольный контент"}
      description={"Navbar.Content вместо заголовка"}
    >
      <Navbar background={"surface"} bottomRadius={16}>
        <Navbar.BackButton />
        <Navbar.Content>
          <Navbar.Title>{"wg0 · Альфа"}</Navbar.Title>
          <Navbar.Subtitle color={"success"}>{"работает"}</Navbar.Subtitle>
        </Navbar.Content>
      </Navbar>
    </DemoSection>

    <DemoSection
      title={"Оформление"}
      description={
        "background — токен темы или цвет, bottomRadius, transparent"
      }
    >
      <Navbar title={"primary"} background={"primary"} bottomRadius={24}>
        <Navbar.Title color={"white"} />
      </Navbar>
      <Navbar title={"onSurface"} background={"onSurface"} />
      <Navbar title={"transparent"} transparent />
    </DemoSection>
  </ScreenScroll>
));
