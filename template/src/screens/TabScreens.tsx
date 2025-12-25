import { Navbar, TabBar } from "@components";
import {
  AppNavigation,
  AppTabScreens,
  ScreenName,
  StackProps,
  TransitionProvider,
  useTransition,
  useTranslation,
} from "@core";
import {
  BottomTabHeaderProps,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { HomeIcon, ListIcon, SettingsIcon } from "lucide-react-native";
import React, { FC, memo, useMemo } from "react";

import { Main, Playground } from "./tabs";
import { Settings } from "./tabs/settings";

interface IProps extends StackProps {}

const TabHeader = ({ options: { title } }: BottomTabHeaderProps) => {
  return <Navbar title={title} safeArea={true} />;
};

export const TAB_SCREENS: AppTabScreens = {
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
  const { t } = useTranslation();
  const context = useTransition();

  const tabs = useMemo(
    () =>
      Object.keys(TAB_SCREENS).reduce<any>((acc, key) => {
        const item = TAB_SCREENS[key as ScreenName];

        acc[key] = {
          ...item,
          options: {
            ...item?.options,
            title: t(item?.options?.title as any),
          },
        } as any;

        return acc;
      }, {}),
    [t],
  );

  return (
    <TransitionProvider context={context}>
      <AppNavigation
        tabBar={props => <TabBar {...props} />}
        routes={tabs}
        screenOptions={screenOptions}
        initialRouteName={"Playground"}
      />
    </TransitionProvider>
  );
});
