import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React, { FC, memo, useMemo } from "react";

import { ScreenName, ScreenParamList } from "./navigation.types";
import { TabScreenOption, TabScreens } from "./types";

const MaterialTopTab = createMaterialTopTabNavigator<ScreenParamList>();

type Props = React.ComponentProps<typeof MaterialTopTab.Navigator>;

interface IProps extends Omit<Props, "children"> {
  routes: TabScreens;
  screenOptions?: TabScreenOption;
  initialRouteName?: keyof TabScreens;
}

export const TopTabNavigation: FC<IProps> = memo(({ routes, ...rest }) => {
  const renderRoutes = useMemo(
    () =>
      (Object.keys(routes) as ScreenName[]).map((name, index) => {
        const { screen, ...rest } = routes[name]!;

        return (
          <MaterialTopTab.Screen
            key={`top-tab-screen-${name}_${index}`}
            navigationKey={`top-tab-screen-${name}_${index}`}
            name={name}
            component={screen as any}
            {...(rest as any)}
          />
        );
      }),
    [routes],
  );

  return (
    <MaterialTopTab.Navigator {...rest}>
      {renderRoutes}
    </MaterialTopTab.Navigator>
  );
});
