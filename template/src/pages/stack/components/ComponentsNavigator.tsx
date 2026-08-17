import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import { useBarScrollSync, useTransition } from "@shared/lib/transition";
import { HiddenBar, Navbar } from "@shared/ui";
import { Tabs } from "@shared/ui/tabs";
import React, { FC } from "react";

import { ComponentsTabName, ComponentsTabsParamList } from "./components.types";
import {
  ButtonsTab,
  CarouselTab,
  ControlsTab,
  DialogsTab,
  FeedbackTab,
  IconsTab,
  InputsTab,
  LayoutTab,
  MediaTab,
  ModalsTab,
  NotificationsTab,
  PickersTab,
  TypographyTab,
} from "./tabs";
import { TicketTab } from "./tabs/Ticket";

const TopTab = createMaterialTopTabNavigator<ComponentsTabsParamList>();

const renderTabBar = ({
  state: { routes: tabRoutes, index },
  navigation,
}: MaterialTopTabBarProps) => (
  <HiddenBar safeArea>
    <Navbar title={"Компоненты"}>
      <Navbar.BackButton />
    </Navbar>
    <HiddenBar.StickyContent>
      <Tabs
        activeIndex={index}
        onPress={routeName => navigation.navigate(routeName)}
        items={tabRoutes.map(route => ({
          title: route.name,
          value: route.name,
        }))}
      />
    </HiddenBar.StickyContent>
  </HiddenBar>
);

interface IComponentsNavigatorProps {
  initialRouteName?: ComponentsTabName;
}

export const ComponentsNavigator: FC<IComponentsNavigatorProps> = ({
  initialRouteName,
}) => {
  const { navbar } = useTransition();
  const telemetry = useScrollTelemetry();

  useBarScrollSync(telemetry, navbar, { mode: "follow" });

  return (
    <ScrollProvider telemetry={telemetry}>
      <TopTab.Navigator
        tabBar={renderTabBar}
        initialRouteName={initialRouteName}
        backBehavior={"none"}
        screenListeners={{
          blur: () => navbar.show(),
          focus: () => navbar.show(),
        }}
      >
        <TopTab.Screen name={"Buttons"} component={ButtonsTab} />
        <TopTab.Screen name={"Typography"} component={TypographyTab} />
        <TopTab.Screen name={"Icons"} component={IconsTab} />
        <TopTab.Screen name={"Inputs"} component={InputsTab} />
        <TopTab.Screen name={"Controls"} component={ControlsTab} />
        <TopTab.Screen name={"Layout"} component={LayoutTab} />
        <TopTab.Screen name={"Feedback"} component={FeedbackTab} />
        <TopTab.Screen name={"Media"} component={MediaTab} />
        <TopTab.Screen name={"Carousel"} component={CarouselTab} />
        <TopTab.Screen name={"Notifications"} component={NotificationsTab} />
        <TopTab.Screen name={"Modals"} component={ModalsTab} />
        <TopTab.Screen name={"Dialogs"} component={DialogsTab} />
        <TopTab.Screen name={"Pickers"} component={PickersTab} />
        <TopTab.Screen name={"Ticket"} component={TicketTab} />
      </TopTab.Navigator>
    </ScrollProvider>
  );
};
