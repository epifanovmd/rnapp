import { Navbar, SwitchTheme, TabBar, Text } from "@components";
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
import React, { FC, memo, useMemo } from "react";
import { View } from "react-native";

import { Main, Playground } from "./tabs";

interface IProps extends StackProps {}

const TabHeader = ({ options: { title } }: BottomTabHeaderProps) => {
  return (
    <Navbar title={title} safeArea={true}>
      <Navbar.Right>
        <View style={{ margin: 12 }}>
          <SwitchTheme marginLeft={"auto"} />
        </View>
      </Navbar.Right>
    </Navbar>
  );
};

export const TAB_SCREENS: AppTabScreens = {
  Main: {
    screen: Main,
    options: {
      title: "navigation.Main",
      tabBarIcon: () => <Text>{"Main"}</Text>,
      headerShown: false,
    },
  },
  Playground: {
    screen: Playground,
    options: {
      title: "navigation.Playground",
      tabBarIcon: () => <Text>{"PG"}</Text>,
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
