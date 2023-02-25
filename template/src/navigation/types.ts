import React from 'react';
import {II18nPaths} from '../localization';
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

export interface Route<
  ScreenProps,
  ScreenOption = AppScreenOption,
  ScreenParams = ScreenParamsTypes[ScreenName],
> {
  screen: React.ComponentType<ScreenProps>;
  options?: ScreenOption;
  initialParams?: Partial<ScreenParams>;
}

export interface AppScreenProps<SN extends ScreenName = any> {
  navigation: BottomTabNavigationProp<ScreenParamList, SN>;
  route: RouteProp<Record<SN, ScreenParamList[SN]>, SN>;
}

export interface BottomTabProps<SN extends ScreenName = any> {
  navigation: MaterialBottomTabNavigationProp<ScreenParamList, SN>;
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
  ScreenParamsTypes[SN]
>;
export type BottomTabRoute<SN extends ScreenName> = Route<
  BottomTabProps<SN>,
  BottomTabScreenOption,
  ScreenParamsTypes[SN]
>;
export type TabRoute<SN extends ScreenName> = Route<
  TabProps<SN>,
  TabScreenOption,
  ScreenParamsTypes[SN]
>;
export type StackRoute<SN extends ScreenName> = Route<
  StackProps<SN>,
  StackScreenOption,
  ScreenParamsTypes[SN]
>;

export type AppTabScreens = {
  [K in ScreenName]?: AppTabRoute<K>;
};
export type BottomTabScreens = {
  [K in ScreenName]?: BottomTabRoute<K>;
};
export type TabScreens = {
  [K in ScreenName]?: TabRoute<K>;
};
export type StackScreens = {
  [K in ScreenName]?: StackRoute<K>;
};
