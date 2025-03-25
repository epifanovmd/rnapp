import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { CardStyleInterpolators } from "@react-navigation/stack";
import { observer } from "mobx-react-lite";
import React, { forwardRef, useMemo } from "react";

import { useSessionDataStore } from "~@store";

import { DebugVars } from "../../debugVars";
import {
  ScreenParamList,
  StackNavigation,
  StackScreenOption,
} from "../navigation";
import { linking } from "./App.linking";
import { PRIVATE_SCREENS, PUBLIC_SCREENS } from "./App.screens";
import { useAppNavigationTheme } from "./hooks";

interface IAppNavigatorProps {
  onReady?: () => void;
}

const options: StackScreenOption = {
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

export const AppNavigator = observer(
  forwardRef<NavigationContainerRef<ScreenParamList>, IAppNavigatorProps>(
    ({ onReady }, ref) => {
      const navigatorTheme = useAppNavigationTheme();

      // useLogger(ref as any);

      const { isAuthorized } = useSessionDataStore();

      const routes = useMemo(() => {
        if (isAuthorized) {
          return { ...PRIVATE_SCREENS, ...PUBLIC_SCREENS };
        }

        return PUBLIC_SCREENS;
      }, [isAuthorized]);

      return (
        <NavigationContainer
          ref={ref}
          linking={linking}
          onReady={onReady}
          theme={navigatorTheme}
        >
          <StackNavigation routes={routes} screenOptions={options} />
        </NavigationContainer>
      );
    },
  ),
);
