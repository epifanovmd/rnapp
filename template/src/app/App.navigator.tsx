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
import React, { forwardRef, useMemo } from "react";
import { Animated } from "react-native";

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

export const cardTransition = ({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle => {
  const progress = Animated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: "clamp",
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: "clamp",
        })
      : 0,
  );

  return {
    cardStyle: {
      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
      transform: [
        {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [screen.width, 0],
            extrapolate: "clamp",
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
        extrapolate: "clamp",
      }),
    },
  };
};

const options: StackScreenOption = {
  gestureEnabled: true,
  cardOverlayEnabled: true,
  cardStyleInterpolator: cardTransition,
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
