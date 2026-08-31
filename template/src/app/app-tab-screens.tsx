/* eslint-disable check-file/filename-naming-convention -- модуль с JSX-иконками таб-бара, не компонент */
import { Main } from "@pages/tabs/main";
import { Playground } from "@pages/tabs/playground";
import { Settings } from "@pages/tabs/settings";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavbarProvider } from "@shared/ui";
import { TabBar, TabBarProvider } from "@widgets/app-shell";
import { HomeIcon, ListIcon, SettingsIcon } from "lucide-react-native";
import React, { PropsWithChildren } from "react";
import { Platform } from "react-native";

/** Layout экрана Tabs корневого стека: общие панели для всех табов. */
export const MainTabsLayout = ({ children }: PropsWithChildren) => (
  <NavbarProvider>
    <TabBarProvider>{children}</TabBarProvider>
  </NavbarProvider>
);

/** Static-конфиг нижних табов (экран `Tabs` корневого стека). */
export const MainTabs = createBottomTabNavigator({
  initialRouteName: "Main",
  tabBar: props => <TabBar {...props} />,
  screenOptions: {
    headerShown: false,
    animation: "shift",
    tabBarHideOnKeyboard: Platform.OS === "android",
  },
  screens: {
    Main: {
      screen: Main,
      options: {
        tabBarIcon: ({ size, color }) => <HomeIcon size={size} color={color} />,
      },
      linking: "main",
    },
    Playground: {
      screen: Playground,
      options: {
        tabBarIcon: ({ size, color }) => <ListIcon size={size} color={color} />,
      },
      linking: "playground",
    },
    Settings: {
      screen: Settings,
      options: {
        tabBarIcon: ({ size, color }) => (
          <SettingsIcon size={size} color={color} />
        ),
      },
      linking: "settings",
    },
  },
});
