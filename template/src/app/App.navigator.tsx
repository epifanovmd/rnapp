import { useLogger } from "@react-navigation/devtools";
import { createStaticNavigation } from "@react-navigation/native";
import { INavigationService, navigationRef } from "@shared/lib/navigation";
import React, { FC, useEffect } from "react";

import { linking } from "./App.linking";
import { RootStack } from "./App.screens";
import { useAppBootstrap, useAppNavigationTheme } from "./hooks";

const Navigation = createStaticNavigation(RootStack);

type RootStackType = typeof RootStack;

/** Регистрация корневого навигатора: наполняет глобальный RootParamList (типизация useNavigation/INavigationService). */
declare module "@react-navigation/core" {
  interface RootNavigator extends RootStackType {}
}

export const AppNavigator: FC = () => {
  const navigationTheme = useAppNavigationTheme();
  const navigationService = INavigationService.useInstance();
  const onReady = useAppBootstrap();

  useLogger(navigationRef);

  useEffect(() => navigationService.subscribe(), [navigationService]);

  return (
    <Navigation
      ref={navigationRef}
      linking={linking}
      theme={navigationTheme}
      onReady={onReady}
    />
  );
};
