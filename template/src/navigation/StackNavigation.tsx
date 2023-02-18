import React, {FC, memo, useCallback, useMemo} from 'react';
import {StackScreenOption, StackScreens} from './types';
import {createStackNavigator} from '@react-navigation/stack';
import {ScreenName} from './navigation.types';
import {useTransformScreenOptions} from './hooks';
import {useTranslation} from '../localization';

const Tab = createStackNavigator();

interface IProps {
  routes: StackScreens;
  screenOptions?: StackScreenOption;
  initialRouteName?: keyof StackScreens;
  detachInactiveScreens?: boolean;
}

export const StackNavigation: FC<IProps> = memo(
  ({routes, screenOptions, initialRouteName, detachInactiveScreens}) => {
    const {t} = useTranslation();
    const transformOptions = useTransformScreenOptions<StackScreenOption>();

    const _screenOptions = useMemo<StackScreenOption>(
      () => ({
        headerShown: false,
        cardStyle: {
          opacity: 1,
          backgroundColor: 'transparent',
          shadowColor: 'transparent',
        },
        ...screenOptions,
      }),
      [screenOptions],
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
        detachInactiveScreens={detachInactiveScreens}>
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
