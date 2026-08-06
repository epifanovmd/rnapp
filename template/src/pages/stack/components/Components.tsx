import {
  StackProps,
  TabScreens,
  TopTabNavigation,
} from "@shared/lib/navigation";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import {
  TransitionProvider,
  useBarScrollSync,
  useTransition,
} from "@shared/lib/transition";
import { HiddenBar, Navbar } from "@shared/ui";
import { Tabs } from "@shared/ui/tabs";
import React, { FC, memo } from "react";

import {
  ButtonsTab,
  ElementsTab,
  ModalsTab,
  NotificationsTab,
  PickersTab,
} from "./tabs";
import { TicketTab } from "./tabs/Ticket";

const routes: TabScreens = {
  Buttons: { screen: ButtonsTab },
  Notifications: { screen: NotificationsTab },
  Modals: { screen: ModalsTab },
  Pickers: { screen: PickersTab },
  Elements: { screen: ElementsTab },
  Ticket: { screen: TicketTab },
};

type TComponentsParams = StackProps<"Components">["route"]["params"];

interface IInnerProps {
  initialRouteName?: NonNullable<TComponentsParams>["initialRouteName"];
}

const ComponentsNavigator: FC<IInnerProps> = ({ initialRouteName }) => {
  const { navbar } = useTransition();
  const telemetry = useScrollTelemetry();

  useBarScrollSync(telemetry, navbar, { mode: "follow" });

  return (
    <ScrollProvider telemetry={telemetry}>
      <TopTabNavigation
        tabBar={({ state: { routes: tabRoutes, index }, navigation }) => {
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
                  items={tabRoutes.map(route => ({
                    title: route.name,
                    value: route.name,
                  }))}
                />
              </HiddenBar.StickyContent>
            </HiddenBar>
          );
        }}
        initialRouteName={initialRouteName}
        routes={routes}
        screenListeners={{
          blur: () => {
            navbar.show();
          },
          focus: () => {
            navbar.show();
          },
        }}
      />
    </ScrollProvider>
  );
};

export const Components: FC<StackProps<"Components">> = memo(({ route }) => {
  return (
    <TransitionProvider>
      <ComponentsNavigator initialRouteName={route.params?.initialRouteName} />
    </TransitionProvider>
  );
});
