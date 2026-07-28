import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React, { FC, memo, useMemo } from "react";
import { Dimensions } from "react-native";

import { ScreenName, ScreenParamList } from "./navigation.types";
import { TabScreenOption, TabScreens } from "./types";

const MaterialTopTab = createMaterialTopTabNavigator<ScreenParamList>();

type Props = React.ComponentProps<typeof MaterialTopTab.Navigator>;

interface IProps extends Omit<Props, "children"> {
  routes: TabScreens;
  screenOptions?: TabScreenOption;
  initialRouteName?: keyof TabScreens;
}

const initialLayout = { width: Dimensions.get("window").width };

export const TabNavigation: FC<IProps> = memo(
  ({ routes, screenOptions, ...rest }) => {
    const _screenOptions: TabScreenOption = useMemo(
      () => ({ backBehavior: "none", ...screenOptions }),
      [screenOptions],
    );

    const renderRoutes = useMemo(
      () =>
        (Object.keys(routes) as ScreenName[]).map((name, index) => {
          const { screen, ...rest } = routes[name]!;

          return (
            <MaterialTopTab.Screen
              key={`tab-screen-${name}_${index}`}
              navigationKey={`tab-screen-${name}_${index}`}
              name={name}
              component={screen as any}
              {...(rest as any)}
            />
          );
        }),
      [routes],
    );

    return (
      <MaterialTopTab.Navigator
        screenOptions={_screenOptions}
        initialLayout={initialLayout}
        {...rest}
      >
        {renderRoutes}
      </MaterialTopTab.Navigator>
    );
  },
);
