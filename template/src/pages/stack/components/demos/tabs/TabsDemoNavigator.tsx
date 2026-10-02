import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import { HiddenBar, Navbar, useNavbar, useNavbarScrollSync } from "@shared/ui";
import { Tabs } from "@shared/ui/tabs";
import React, { FC } from "react";

import { TabsDemoPage } from "./TabsDemoPage";

type TTabsDemoParamList = {
  Обзор: undefined;
  Пиры: undefined;
  Логи: undefined;
  Статистика: undefined;
  Настройки: undefined;
};

const TopTab = createMaterialTopTabNavigator<TTabsDemoParamList>();

const SCREEN_OPTIONS = { lazy: true };

const renderTabBar = ({
  state: { routes, index },
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
        items={routes.map(route => ({ title: route.name, value: route.name }))}
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
        screenListeners={{
          blur: () => navbar.show(),
          focus: () => navbar.show(),
        }}
      >
        <TopTab.Screen name={"Обзор"} component={TabsDemoPage} />
        <TopTab.Screen name={"Пиры"} component={TabsDemoPage} />
        <TopTab.Screen name={"Логи"} component={TabsDemoPage} />
        <TopTab.Screen name={"Статистика"} component={TabsDemoPage} />
        <TopTab.Screen name={"Настройки"} component={TabsDemoPage} />
      </TopTab.Navigator>
    </ScrollProvider>
  );
};
