import React from 'react';
// import {II18nPaths} from '../localization';
import {BottomTabNavigationOptions} from '@react-navigation/bottom-tabs';
import {
  MaterialBottomTabNavigationOptions,
  MaterialBottomTabNavigationProp,
} from '@react-navigation/material-bottom-tabs';
import {
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationProp,
} from '@react-navigation/material-top-tabs';
import {StackNavigationOptions} from '@react-navigation/stack';
import {ScreenName, ScreenParamsTypes} from './navigation.types';
import {RouteProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs/src/types';
import {StackNavigationProp} from '@react-navigation/stack/src/types';

interface II18nPaths {}

export type ScreenParamList = ScreenParamsTypes;

export type AppScreenOption =
  | Partial<Omit<BottomTabNavigationOptions, 'title'> & {title: II18nPaths}>
  | undefined;

export type BottomTabScreenOption =
  | Partial<
      Omit<MaterialBottomTabNavigationOptions, 'title'> & {title: II18nPaths}
    >
  | undefined;

export type TabScreenOption =
  | Partial<
      Omit<MaterialTopTabNavigationOptions, 'title'> & {title: II18nPaths}
    >
  | undefined;

export type StackScreenOption =
  | Partial<Omit<StackNavigationOptions, 'title'> & {title: II18nPaths}>
  | undefined;

export interface Route<ScreenProps, ScreenOption = AppScreenOption> {
  screen: React.ComponentType<ScreenProps>;
  options?: ScreenOption;
  initialParams?: Record<string, object | undefined>;
}

export interface AppScreenProps<
  ParamList extends ScreenParamList = ScreenParamList,
  RouteName extends keyof ParamList = keyof ParamList,
> {
  navigation: BottomTabNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, ScreenName>;
}

export interface BottomTabProps<
  ParamList extends ScreenParamList = ScreenParamList,
  RouteName extends keyof ParamList = keyof ParamList,
> {
  navigation: MaterialBottomTabNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, RouteName>;
}

export interface TabProps<
  ParamList extends ScreenParamList = ScreenParamList,
  RouteName extends keyof ParamList = keyof ParamList,
> {
  navigation: MaterialTopTabNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, RouteName>;
}

export interface StackProps<
  ParamList extends ScreenParamList = ScreenParamList,
  RouteName extends keyof ParamList = keyof ParamList,
> {
  navigation: StackNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, RouteName>;
}

export type AppTabRoute = Route<AppScreenProps>;
export type BottomTabRoute = Route<any, BottomTabScreenOption>;
export type TabRoute = Route<any, TabScreenOption>;
export type StackRoute = Route<any, StackScreenOption>;

export type AppTabScreens = {[key in ScreenName]?: AppTabRoute};
export type BottomTabScreens = {
  [key in ScreenName]?: BottomTabRoute;
};
export type TabScreens = {
  [key in ScreenName]?: TabRoute;
};
export type StackScreens = {[key in ScreenName]?: StackRoute};
