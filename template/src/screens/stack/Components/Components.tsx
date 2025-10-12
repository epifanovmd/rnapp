import { HiddenBar, Navbar } from "@components";
import { Tabs } from "@components/ui/tabs";
import {
  StackProps,
  TabScreens,
  TopTabNavigation,
  TransitionProvider,
  useTransitionContext,
} from "@core";
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
  const context = useTransitionContext();

  return (
    <TransitionProvider context={context}>
      <TopTabNavigation
        tabBar={({ state: { routes, index }, navigation }) => {
          return (
            <HiddenBar safeArea>
              <Navbar title={"Компоненты"}>
                <Navbar.BackButton />
              </Navbar>
              <HiddenBar.StickyContent>
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
              </HiddenBar.StickyContent>
            </HiddenBar>
          );
        }}
        initialRouteName={route.params?.initialRouteName}
        routes={routes}
        screenListeners={{
          blur: e => {
            context.showNavbar();
          },
          focus: e => {
            context.showNavbar();
          },
        }}
      />
    </TransitionProvider>
  );
});
