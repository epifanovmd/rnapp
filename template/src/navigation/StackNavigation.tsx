import {
  DefaultNavigatorOptions,
  StackNavigationState,
  StackRouterOptions,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { FC, memo, useMemo } from "react";

import { ScreenName, ScreenParamList } from "./navigation.types";
import { StackScreenOption, StackScreens } from "./types";

const Stack = createStackNavigator<ScreenParamList>();

type Props = React.ComponentProps<typeof Stack.Navigator>;

interface IProps extends Omit<Props, "children"> {
  routes: StackScreens;
  screenOptions?: StackScreenOption;
  initialRouteName?: keyof StackScreens;
}

export const StackNavigation: FC<IProps> = memo(
  ({ routes, screenOptions, ...rest }) => {
    const _screenOptions = useMemo<StackScreenOption>(
      () => ({
        headerShown: false,
        cardStyle: {
          opacity: 1,
          shadowColor: "transparent",
        },
        ...screenOptions,
      }),
      [screenOptions],
    );

    const renderRoutes = useMemo(
      () =>
        (Object.keys(routes) as ScreenName[]).map((name, index) => (
          <Stack.Screen
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
      <Stack.Navigator screenOptions={_screenOptions} {...rest}>
        {renderRoutes}
      </Stack.Navigator>
    );
  },
);
