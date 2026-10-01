import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import {
  HiddenBar,
  Navbar,
  SegmentedTabBar,
  useNavbar,
  useNavbarScrollSync,
} from "@shared/ui";
import React, { FC } from "react";

import { ComponentsTabName, ComponentsTabsParamList } from "./components.types";
import {
  ButtonsTab,
  CarouselTab,
  ControlsTab,
  DataTab,
  DialogsTab,
  FeedbackTab,
  FormsTab,
  IconsTab,
  InputsTab,
  LayoutTab,
  ListsTab,
  MediaTab,
  ModalsTab,
  NotificationsTab,
  PickersTab,
  ScreenTab,
  SettingsTab,
  TypographyTab,
} from "./tabs";
import { TicketTab } from "./tabs/Ticket";

const TopTab = createMaterialTopTabNavigator<ComponentsTabsParamList>();

const renderTabBar = (props: MaterialTopTabBarProps) => (
  <HiddenBar safeArea>
    <Navbar title={"Компоненты"}>
      <Navbar.BackButton />
    </Navbar>
    <HiddenBar.StickyContent>
      <SegmentedTabBar {...props} scrollable mh={16} mb={8} />
    </HiddenBar.StickyContent>
  </HiddenBar>
);

interface IComponentsNavigatorProps {
  initialRouteName?: ComponentsTabName;
}

export const ComponentsNavigator: FC<IComponentsNavigatorProps> = ({
  initialRouteName,
}) => {
  const navbar = useNavbar();
  const telemetry = useScrollTelemetry();

  useNavbarScrollSync(telemetry);

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
        <TopTab.Screen name={"Forms"} component={FormsTab} />
        <TopTab.Screen name={"Layout"} component={LayoutTab} />
        <TopTab.Screen name={"Lists"} component={ListsTab} />
        <TopTab.Screen name={"Data"} component={DataTab} />
        <TopTab.Screen name={"Settings"} component={SettingsTab} />
        <TopTab.Screen name={"Screen"} component={ScreenTab} />
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
