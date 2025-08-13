import { Navbar, SwitchTheme, Text } from "@components";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import React, { FC, memo, useMemo } from "react";
import { View } from "react-native";

import { useTranslation } from "../localization";
import {
  AppNavigation,
  AppTabScreens,
  ScreenName,
  StackProps,
} from "../navigation";
import { Main, Playground } from "./tabs";

interface IProps extends StackProps {}

export const TAB_SCREENS: AppTabScreens = {
  Main: {
    screen: Main,
    options: {
      title: "navigation.Main",
      tabBarIcon: () => <Text>{"Main"}</Text>,
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

export const TabScreens: FC<IProps> = memo(() => {
  const { t } = useTranslation();

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
    <AppNavigation
      routes={tabs}
      screenOptions={{
        headerShown: true,
        header: ({ route: { name } }: BottomTabHeaderProps) => {
          return (
            <Navbar
              title={t(`navigation.${name}` as any)}
              subTitle={"Sub title"}
              safeArea={true}
              backButton={false}
              right={
                <View style={{ margin: 12 }}>
                  <SwitchTheme marginLeft={"auto"} />
                </View>
              }
            />
          );
        },
      }}
    />
  );
});
