import React, {FC, memo, useCallback, useMemo} from 'react';
import {Platform, StyleSheet} from 'react-native';
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {Theme, useTheme, useThemeAwareObject} from '../theme';
import {AppScreenOption, AppTabScreens} from './types';
import {BackBehavior} from '@react-navigation/routers/lib/typescript/src/TabRouter';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs/src/types';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ScreenName} from './navigation.types';
import {useTransformScreenOptions} from './hooks';
import {useTranslation} from '../localization';

const Tab = createBottomTabNavigator();

interface IProps {
  routes: AppTabScreens;
  screenOptions?: BottomTabNavigationOptions;
  initialRouteName?: string;
  detachInactiveScreens?: boolean;
  backBehavior?: BackBehavior;
  tabBar?: (props: BottomTabBarProps) => React.ReactNode;
}

export const AppNavigation: FC<IProps> = memo(
  ({
    routes,
    screenOptions,
    initialRouteName,
    detachInactiveScreens,
    backBehavior,
    tabBar,
  }) => {
    const {theme} = useTheme();
    const {t} = useTranslation();
    const styles = useThemeAwareObject(createStyles);
    const transformOptions = useTransformScreenOptions<AppScreenOption>();
    const {bottom} = useSafeAreaInsets();

    const _screenOptions = useMemo<BottomTabNavigationOptions>(
      () => ({
        unmountOnBlur: true,
        headerShown: false,
        tabBarStyle: {
          height: 50 + bottom,
          paddingBottom: bottom,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: theme.color.common.white,
        tabBarInactiveTintColor: theme.color.grey.grey200,
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarItemStyle: {
          height: 50 + bottom,
          paddingBottom: bottom,
          backgroundColor: theme.color.grey.grey700,
          padding: 6,
        },
        ...screenOptions,
      }),
      [
        bottom,
        theme.color.common.white,
        theme.color.grey.grey200,
        theme.color.grey.grey700,
        screenOptions,
      ],
    );

    const getTitle = useCallback(
      (name: ScreenName) => {
        const routeTitle = routes[name]?.options?.title;

        return t(routeTitle ?? (`navigation.${name}` as any)) as any;
      },
      [routes, t],
    );

    return (
      <Tab.Navigator
        screenOptions={_screenOptions}
        initialRouteName={initialRouteName}
        detachInactiveScreens={detachInactiveScreens}
        backBehavior={backBehavior}
        tabBar={tabBar}
        sceneContainerStyle={styles.sceneContainerStyle}>
        {(Object.keys(routes) as ScreenName[]).map((name, index) => (
          <Tab.Screen
            key={`screen-${index + 1}-${name}`}
            options={transformOptions(routes[name]!.options)}
            navigationKey={`screen-${index + 1}-${name}`}
            name={getTitle(name)}
            component={routes[name]!.screen}
            initialParams={routes[name]!.initialParams}
          />
        ))}
      </Tab.Navigator>
    );
  },
);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    sceneContainerStyle: {
      backgroundColor: theme.color.common.white,
    },
  });
