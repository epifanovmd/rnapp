import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import {
  MaterialBottomTabNavigationConfig,
  MaterialBottomTabNavigationEventMap,
  MaterialBottomTabNavigationOptions,
} from "@react-navigation/material-bottom-tabs/src/types";
import {
  DefaultNavigatorOptions,
  TabNavigationState,
  TabRouterOptions,
} from "@react-navigation/native";
import React, { FC, memo, useMemo } from "react";

import { ScreenName, ScreenParamList } from "./navigation.types";
import { BottomTabScreenOption, BottomTabScreens } from "./types";

const MaterialBottomTab = createMaterialBottomTabNavigator<ScreenParamList>();

type Props = React.ComponentProps<typeof MaterialBottomTab.Navigator>;

interface IProps extends Omit<Props, "children"> {
  routes: BottomTabScreens;
  screenOptions?: BottomTabScreenOption;
  initialRouteName?: keyof BottomTabScreens;
}

export const BottomTabNavigation: FC<IProps> = memo(
  ({ routes, screenOptions, ...rest }) => {
    const _screenOptions: BottomTabScreenOption = useMemo(
      () => ({ headerShown: false, ...screenOptions }),
      [screenOptions],
    );

    const renderRoutes = useMemo(
      () =>
        (Object.keys(routes) as ScreenName[]).map((name, index) => (
          <MaterialBottomTab.Screen
            key={`screen-${index + 1}-${name}`}
            options={routes[name]!.options}
            navigationKey={`screen-${index + 1}-${name}`}
            name={name}
            component={routes[name]!.screen as any}
            initialParams={routes[name]!.initialParams}
          />
        )),
      [routes],
    );

    return (
      <MaterialBottomTab.Navigator screenOptions={_screenOptions} {...rest}>
        {renderRoutes}
      </MaterialBottomTab.Navigator>
    );
  },
);
