import { Tabs } from "@components/ui/tabs";
import { StackProps, TabScreens, TopTabNavigation } from "@core";
import React, { FC, memo } from "react";

import { ButtonsTab, NotificationsTab } from "./tabs";
import { ModalsTab } from "./tabs/Modals";
import { PickersTab } from "./tabs/PickersTab";

const routes: TabScreens = {
  Buttons: { screen: ButtonsTab },
  Notifications: { screen: NotificationsTab },
  Modals: { screen: ModalsTab },
  Pickers: { screen: PickersTab },
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
