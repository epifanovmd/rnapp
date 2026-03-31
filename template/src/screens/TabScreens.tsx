import { Navbar, TabBar } from "@components";
import { TransitionProvider, useTransition } from "@core";
import {
  AppNavigation,
  AppTabScreens,
  ScreenName,
  StackProps,
} from "@navigation";
import {
  BottomTabHeaderProps,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import {
  HomeIcon,
  ListIcon,
  MessageSquareIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react-native";
import React, { FC, memo, useMemo } from "react";

import { Chats, Contacts, Main, Playground } from "./tabs";
import { Settings } from "./tabs/settings";

interface IProps extends StackProps {}

const TabHeader = ({ options: { title } }: BottomTabHeaderProps) => {
  return <Navbar title={title} safeArea={true} />;
};

export const TAB_SCREENS: AppTabScreens = {
  Chats: {
    screen: Chats,
    options: {
      tabBarIcon: ({ size, color }) => (
        <MessageSquareIcon size={size} color={color} />
      ),
      headerShown: false,
    },
  },
  Contacts: {
    screen: Contacts,
    options: {
      tabBarIcon: ({ size, color }) => <UsersIcon size={size} color={color} />,
      headerShown: false,
    },
  },
  Main: {
    screen: Main,
    options: {
      tabBarIcon: ({ size, color }) => <HomeIcon size={size} color={color} />,
      headerShown: false,
    },
  },
  Playground: {
    screen: Playground,
    options: {
      tabBarIcon: ({ size, color }) => <ListIcon size={size} color={color} />,
      headerShown: false,
    },
  },
  Settings: {
    screen: Settings,
    options: {
      tabBarIcon: ({ size, color }) => (
        <SettingsIcon size={size} color={color} />
      ),
      headerShown: false,
    },
  },
};

const screenOptions: BottomTabNavigationOptions = {
  headerShown: true,
  header: TabHeader,
};

export const TabScreens: FC<IProps> = memo(() => {
  const context = useTransition();

  return (
    <TransitionProvider context={context}>
      <AppNavigation
        tabBar={props => <TabBar {...props} />}
        routes={TAB_SCREENS}
        screenOptions={screenOptions}
        initialRouteName={"Chats"}
      />
    </TransitionProvider>
  );
});
