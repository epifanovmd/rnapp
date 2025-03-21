import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { observer } from "mobx-react-lite";
import React, { FC, useMemo } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenName, ScreenParamList } from "./navigation.types";
import { AppTabScreens } from "./types";

const BottomTab = createBottomTabNavigator<ScreenParamList>();

type Props = React.ComponentProps<typeof BottomTab.Navigator>;

interface IProps extends Omit<Props, "children"> {
  routes: AppTabScreens;
  screenOptions?: BottomTabNavigationOptions;
  initialRouteName?: ScreenName;
}

export const AppNavigation: FC<IProps> = observer(
  ({
    routes,
    screenOptions,
    detachInactiveScreens,
    backBehavior,
    tabBar,
    screenListeners,
    ...rest
  }) => {
    const insets = useSafeAreaInsets();

    const _screenOptions = useMemo<BottomTabNavigationOptions>(
      () => ({
        unmountOnBlur: false,
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS === "android",
        ...screenOptions,
      }),
      [screenOptions],
    );

    return (
      <BottomTab.Navigator
        detachInactiveScreens={detachInactiveScreens}
        backBehavior={backBehavior}
        tabBar={tabBar}
        screenListeners={screenListeners}
        safeAreaInsets={insets}
        screenOptions={_screenOptions}
        {...rest}
      >
        {(Object.keys(routes) as ScreenName[]).map((name, index) => (
          <BottomTab.Screen
            key={`screen-${index + 1}-${name}`}
            options={routes[name]!.options}
            navigationKey={`screen-${index + 1}-${name}`}
            name={name}
            component={routes[name]!.screen as any}
            initialParams={routes[name]!.initialParams}
          />
        ))}
      </BottomTab.Navigator>
    );
  },
);
