import { useBiometric } from "@common";
import { Navbar, SwitchTheme } from "@components";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { StackHeaderProps } from "@react-navigation/stack";
import { useAppDataStore } from "@store";
import { observer } from "mobx-react-lite";
import React, { forwardRef, useCallback, useMemo } from "react";
import { View } from "react-native";
import BootSplash from "react-native-bootsplash";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";

import { useTranslation } from "../localization";
import {
  ScreenParamList,
  StackNavigation,
  StackScreenOption,
} from "../navigation";
import { linking } from "./App.linking";
import { PRIVATE_SCREENS, PUBLIC_SCREENS } from "./App.screens";
import { stackTransition } from "./common";
import { useAppNavigationTheme } from "./hooks";

interface IAppNavigatorProps {}

const AppHeader = ({ route: { name } }: StackHeaderProps) => {
  const { t } = useTranslation();

  return (
    <Navbar
      title={t(`navigation.${name}` as any)}
      subTitle={"Sub title"}
      safeArea={true}
      right={
        <View style={{ margin: 12 }}>
          <SwitchTheme marginLeft={"auto"} />
        </View>
      }
    />
  );
};

const options: StackScreenOption = {
  gestureEnabled: true,
  cardOverlayEnabled: true,
  cardStyleInterpolator: stackTransition,
  // cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  headerShown: true,
  header: AppHeader,
};

export const AppNavigator = observer(
  forwardRef<NavigationContainerRef<ScreenParamList>, IAppNavigatorProps>(
    (_props, ref) => {
      const navigatorTheme = useAppNavigationTheme();
      const { sessionDataStore } = useAppDataStore();
      const { available, authorization } = useBiometric();

      // useLogger(ref as any);

      const routes = useMemo(() => {
        if (sessionDataStore.isAuthorized) {
          return { ...PRIVATE_SCREENS, ...PUBLIC_SCREENS };
        }

        return PUBLIC_SCREENS;
      }, [sessionDataStore.isAuthorized]);

      const onReady = useCallback(async () => {
        await sessionDataStore.restore();

        if (available && !sessionDataStore.isAuthorized) {
          await authorization();
        }

        setTimeout(() => {
          trigger(HapticFeedbackTypes.impactLight);
          BootSplash.hide({ fade: true });
        }, 500);
      }, [authorization, available, sessionDataStore]);

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
