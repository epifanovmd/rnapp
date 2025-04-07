import notifee from "@notifee/react-native";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
} from "@react-navigation/stack";
import { useSessionDataStore } from "@store";
import { observer } from "mobx-react-lite";
import React, { forwardRef, useEffect, useMemo } from "react";
import { Animated } from "react-native";

import {
  ScreenParamList,
  StackNavigation,
  StackScreenOption,
} from "../navigation";
import { linking } from "./App.linking";
import { PRIVATE_SCREENS, PUBLIC_SCREENS } from "./App.screens";
import { stackTransition } from "./common";
import { useAppNavigationTheme } from "./hooks";

interface IAppNavigatorProps {
  onReady?: () => void;
}

const options: StackScreenOption = {
  gestureEnabled: true,
  cardOverlayEnabled: true,
  cardStyleInterpolator: stackTransition,
  // cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
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

      useEffect(() => {
        notifee.requestPermission();
      }, []);

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
