import { Tabs } from "@components/ui/tabs";
import { StackProps, TabScreens, TopTabNavigation } from "@core";
import React, { FC, memo } from "react";

import {
  ButtonsTab,
  ElementsTab,
  ModalsTab,
  NotificationsTab,
  PickersTab,
} from "./tabs";

const routes: TabScreens = {
  Buttons: { screen: ButtonsTab },
  Notifications: { screen: NotificationsTab },
  Modals: { screen: ModalsTab },
  Pickers: { screen: PickersTab },
  ElementsTab: { screen: ElementsTab },
};

export const Components: FC<StackProps<"Components">> = memo(({ route }) => {
  return (
    <TopTabNavigation
      tabBar={({ state: { routes, index }, navigation }) => {
        return (
          <Tabs
            activeIndex={index}
            onPress={routeName => {
              navigation.navigate(routeName);
            }}
            items={routes.map(route => ({
              title: route.name,
              value: route.name,
            }))}
          />
        );
      }}
      initialRouteName={route.params?.initialRouteName}
      routes={routes}
      screenOptions={{}}
    />
  );
});
