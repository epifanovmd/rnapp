import React, {FC, memo, useMemo} from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import {BottomTabScreenOption, BottomTabScreens} from './types';
import {BackBehavior} from '@react-navigation/routers/lib/typescript/src/TabRouter';
import {ScreenName} from './navigation.types';
import {useTransformScreenOptions} from './hooks';
import {toLowerCase} from '@force-dev/utils';
import {useTranslation} from '../localization';

const Tab = createMaterialBottomTabNavigator();

interface IProps {
  routes: BottomTabScreens;
  screenOptions?: BottomTabScreenOption;
  initialRouteName?: string;
  backBehavior?: BackBehavior;
  shifting?: boolean;
  labeled?: boolean;
  sceneAnimationEnabled?: boolean;
  keyboardHidesNavigationBar?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  barStyle?: StyleProp<ViewStyle>;
}

export const BottomTabNavigation: FC<IProps> = memo(
  ({
    routes,
    screenOptions,
    initialRouteName,
    backBehavior,
    shifting,
    labeled,
    activeColor,
    inactiveColor,
    barStyle,
    keyboardHidesNavigationBar,
    sceneAnimationEnabled,
  }) => {
    const {t} = useTranslation();
    const transformOptions = useTransformScreenOptions<BottomTabScreenOption>();

    const _screenOptions: BottomTabScreenOption = useMemo(
      () => ({headerShown: false, ...screenOptions}),
      [screenOptions],
    );

    return (
      <Tab.Navigator
        screenOptions={_screenOptions}
        initialRouteName={initialRouteName}
        backBehavior={backBehavior}
        shifting={shifting}
        labeled={labeled}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
        barStyle={barStyle}
        keyboardHidesNavigationBar={keyboardHidesNavigationBar}
        sceneAnimationEnabled={sceneAnimationEnabled}>
        {(Object.keys(routes) as ScreenName[]).map((name, index) => (
          <Tab.Screen
            key={`screen-${index + 1}-${name}`}
            options={transformOptions(routes[name]!.options)}
            navigationKey={`screen-${index + 1}-${name}`}
            name={t(`navigation.${toLowerCase(name)}` as any) as any}
            component={routes[name]!.screen}
            initialParams={routes[name]!.initialParams}
          />
        ))}
      </Tab.Navigator>
    );
  },
);
