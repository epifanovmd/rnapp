import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import { HiddenBar, Navbar, useNavbar, useNavbarScrollSync } from "@shared/ui";
import { Tabs } from "@shared/ui/tabs";
import React, { FC } from "react";

import { ITabsDemoPageParams, TabsDemoPage } from "./TabsDemoPage";

type TTabsDemoParamList = Record<TTabsDemoRoute, ITabsDemoPageParams>;

type TTabsDemoRoute = "overview" | "tasks" | "logs" | "stats" | "settings";

const TABS: { name: TTabsDemoRoute; title: string }[] = [
  { name: "overview", title: "Обзор" },
  { name: "tasks", title: "Задачи" },
  { name: "logs", title: "Логи" },
  { name: "stats", title: "Статистика" },
  { name: "settings", title: "Настройки" },
];

const TopTab = createMaterialTopTabNavigator<TTabsDemoParamList>();

const SCREEN_OPTIONS = { lazy: true };

const renderTabBar = ({
  state: { routes, index },
  descriptors,
  navigation,
}: MaterialTopTabBarProps) => (
  <HiddenBar safeArea>
    <Navbar title={"Tabs"}>
      <Navbar.BackButton />
    </Navbar>
    <HiddenBar.StickyContent>
      <Tabs
        activeIndex={index}
        onPress={routeName => navigation.navigate(routeName)}
        items={routes.map(route => ({
          title: descriptors[route.key]?.options.title ?? route.name,
          value: route.name,
        }))}
      />
    </HiddenBar.StickyContent>
  </HiddenBar>
);

/**
 * Вкладки под скрываемой шапкой: шапка следует за скроллом активной вкладки,
 * полоса вкладок закреплена; при смене вкладки шапка показывается.
 */
export const TabsDemoNavigator: FC = () => {
  const navbar = useNavbar();
  const telemetry = useScrollTelemetry();

  useNavbarScrollSync(telemetry);

  return (
    <ScrollProvider telemetry={telemetry}>
      <TopTab.Navigator
        tabBar={renderTabBar}
        backBehavior={"none"}
        screenOptions={SCREEN_OPTIONS}
        screenListeners={navbar.screenListeners}
      >
        {TABS.map(({ name, title }) => (
          <TopTab.Screen
            key={name}
            name={name}
            component={TabsDemoPage}
            options={{ title }}
            initialParams={{ title }}
          />
        ))}
      </TopTab.Navigator>
    </ScrollProvider>
  );
};
