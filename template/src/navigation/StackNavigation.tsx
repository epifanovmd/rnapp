import React, {FC, memo, useMemo} from 'react';
import {StackScreens} from './types';
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {ScreenName} from './navigation.types';
// import {useTransformScreenOptions} from './hooks';

const Tab = createStackNavigator();

interface IProps {
  routes: StackScreens;
  screenOptions?: StackNavigationOptions;
  initialRouteName?: keyof StackScreens;
  detachInactiveScreens?: boolean;
}

export const StackNavigation: FC<IProps> = memo(
  ({routes, screenOptions, initialRouteName, detachInactiveScreens}) => {
    // const transformOptions = useTransformScreenOptions<StackScreenOption>();

    const _screenOptions = useMemo<StackNavigationOptions>(
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

    return (
      <Tab.Navigator
        screenOptions={_screenOptions}
        initialRouteName={initialRouteName}
        detachInactiveScreens={detachInactiveScreens}>
        {(Object.keys(routes) as ScreenName[]).map((name, index) => (
          <Tab.Screen
            key={`screen-${index + 1}-${name}`}
            // options={transformOptions(routes[name]!.options)}
            options={routes[name]!.options}
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
