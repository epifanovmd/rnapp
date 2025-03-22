import {
  BottomTabNavigationOptions,
  BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
import { EventMapBase, ScreenListeners } from "@react-navigation/core";
import {
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationProp,
} from "@react-navigation/material-top-tabs";
import { RouteProp } from "@react-navigation/native";
import { NavigationState, ParamListBase } from "@react-navigation/routers";
import {
  StackNavigationOptions,
  StackNavigationProp,
} from "@react-navigation/stack";
import React from "react";

import { ScreenName, ScreenParamList } from "./navigation.types";

export type AppScreenOption = Partial<BottomTabNavigationOptions> | undefined;

export type TabScreenOption =
  | Partial<MaterialTopTabNavigationOptions>
  | undefined;

export type StackScreenOption = Partial<StackNavigationOptions> | undefined;

export interface Route<
  ScreenProps,
  ScreenOption = AppScreenOption,
  ScreenParams extends ParamListBase = ScreenParamList[ScreenName],
> {
  screen: React.ComponentType<ScreenProps>;
  options?: ScreenOption;

  listeners?:
    | ScreenListeners<NavigationState<ScreenParams>, EventMapBase>
    | ((
        props: AppScreenProps,
      ) => ScreenListeners<NavigationState<ScreenParams>, EventMapBase>);

  layout?: (
    props: AppScreenProps & {
      theme: ReactNavigation.Theme;
      children: React.ReactElement;
    },
  ) => React.ReactElement;
  getId?: ({
    params,
  }: {
    params: Readonly<ScreenParams>;
  }) => string | undefined;
  initialParams?: Partial<ScreenParams>;
}

export interface AppScreenProps<SN extends ScreenName = any> {
  navigation: BottomTabNavigationProp<ScreenParamList, SN>;
  route: RouteProp<Record<SN, ScreenParamList[SN]>, SN>;
}

export interface TabProps<SN extends ScreenName = any> {
  navigation: MaterialTopTabNavigationProp<ScreenParamList, SN>;
  route: RouteProp<Record<SN, ScreenParamList[SN]>, SN>;
}

export interface StackProps<SN extends ScreenName = any> {
  navigation: StackNavigationProp<ScreenParamList, SN>;
  route: RouteProp<Record<SN, ScreenParamList[SN]>, SN>;
}

export type AppTabRoute<SN extends ScreenName> = Route<
  AppScreenProps<SN>,
  AppScreenOption,
  ScreenParamList[SN]
>;
export type TabRoute<SN extends ScreenName> = Route<
  TabProps<SN>,
  TabScreenOption,
  ScreenParamList[SN]
>;
export type StackRoute<SN extends ScreenName> = Route<
  StackProps<SN>,
  StackScreenOption,
  ScreenParamList[SN]
>;

export type AppTabScreens = {
  [K in ScreenName]?: AppTabRoute<K>;
};
export type TabScreens = {
  [K in ScreenName]?: TabRoute<K>;
};
export type StackScreens = {
  [K in ScreenName]?: StackRoute<K>;
};
