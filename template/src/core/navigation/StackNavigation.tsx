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
        (Object.keys(routes) as ScreenName[]).map((name, index) => {
          const { screen, ...rest } = routes[name]!;

          return (
            <Stack.Screen
              key={`stack-screen-${name}_${index}`}
              navigationKey={`stack-screen-${name}_${index}`}
              name={name}
              component={screen as any}
              {...(rest as any)}
            />
          );
        }),
      [routes],
    );

    return (
      <Stack.Navigator screenOptions={_screenOptions} {...rest}>
        {renderRoutes}
      </Stack.Navigator>
    );
  },
);
