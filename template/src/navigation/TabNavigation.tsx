import React, {FC, memo, useMemo} from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import {Theme, useThemeAwareObject} from '../theme';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {TabScreenOption, TabScreens} from './types';
import {MaterialTopTabBarProps} from '@react-navigation/material-top-tabs/lib/typescript/src/types';
import {BackBehavior} from '@react-navigation/routers/lib/typescript/src/TabRouter';
import {ScreenName} from './navigation.types';
import {useTransformScreenOptions} from './hooks';

const Tab = createMaterialTopTabNavigator();

interface IProps {
  routes: TabScreens;
  screenOptions?: TabScreenOption;
  initialRouteName?: keyof TabScreens;
  tabBarPosition?: 'top' | 'bottom';
  tabBar?: (props: MaterialTopTabBarProps) => React.ReactNode;
  backBehavior?: BackBehavior;
  keyboardDismissMode?: 'none' | 'on-drag' | 'auto';
}

const initialLayout = {width: Dimensions.get('window').width};

export const TabNavigation: FC<IProps> = memo(
  ({
    routes,
    screenOptions,
    initialRouteName,
    tabBarPosition,
    tabBar = () => null,
    backBehavior,
    keyboardDismissMode,
  }) => {
    const styles = useThemeAwareObject(createStyles);
    const transformOptions = useTransformScreenOptions<TabScreenOption>();

    const _screenOptions: TabScreenOption = useMemo(
      () => ({backBehavior: 'none', ...screenOptions}),
      [screenOptions],
    );

    return (
      <Tab.Navigator
        screenOptions={_screenOptions}
        initialRouteName={initialRouteName}
        tabBarPosition={tabBarPosition}
        tabBar={tabBar}
        backBehavior={backBehavior}
        keyboardDismissMode={keyboardDismissMode}
        initialLayout={initialLayout}
        sceneContainerStyle={styles.sceneContainerStyle}>
        {(Object.keys(routes) as ScreenName[]).map((name, index) => (
          <Tab.Screen
            key={`screen-${index + 1}-${name}`}
            options={transformOptions(routes[name]!.options)}
            navigationKey={`screen-${index + 1}-${name}`}
            name={name}
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
