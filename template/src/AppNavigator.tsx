import { HoldItemProvider } from "@force-dev/react-mobile";
import {
  LinkingOptions,
  NavigationContainer,
  NavigationContainerRef,
  PathConfigMap,
} from "@react-navigation/native";
import { CardStyleInterpolators } from "@react-navigation/stack";
import { observer } from "mobx-react-lite";
import React, { forwardRef, useMemo } from "react";
import { Linking } from "react-native";
import Config from "react-native-config";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessionDataStore } from "~@store";
import { useTheme } from "~@theme";

import {
  AppTabScreens,
  ScreenName,
  ScreenParamList,
  StackNavigation,
  StackScreenOption,
  StackScreens,
} from "./navigation";
import {
  Authorization,
  ChatScreen,
  Components,
  Modals,
  Notifications,
  Pickers,
  PostScreen,
  TAB_SCREENS,
  TabScreens,
} from "./screens";
import { Gallery } from "./screens/stack/Gallery";

interface IProps {
  onReady?: () => void;
}

export const PRIVATE_SCREENS: StackScreens = {
  MAIN: { screen: TabScreens },

  Post: { screen: PostScreen },
  Notifications: { screen: Notifications },
  Gallery: { screen: Gallery },
  Pickers: { screen: Pickers },
  Components: { screen: Components },
  Modals: { screen: Modals },
  ChatScreen: { screen: ChatScreen },
};

export const PUBLIC_SCREENS: StackScreens = {
  Authorization: { screen: Authorization },
};

const options: StackScreenOption = {
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

const deeplinkBaseUrl = Config.DEEPLINK_BASE_URL;

const getPathMap = (
  screens: StackScreens | AppTabScreens,
  tabsScreenName?: ScreenName,
  tabScreens?: AppTabScreens,
) =>
  Object.keys(screens).reduce<PathConfigMap<ScreenParamList>>((acc, key) => {
    if (tabsScreenName && tabScreens && key === tabsScreenName) {
      acc[key as ScreenName] = {
        screens: {
          ...getPathMap(tabScreens),
        },
      };
    } else {
      acc[key as ScreenName] = key;
    }

    return acc;
  }, {});

const linking: LinkingOptions<ScreenParamList> = {
  prefixes: [`${deeplinkBaseUrl}://`],

  async getInitialURL() {
    return await Linking.getInitialURL();
  },

  subscribe: listener => {
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      listener(url);
    });

    return () => {
      linkingSubscription.remove();
    };
  },

  config: {
    // Deep link configuration
    screens: getPathMap(
      { ...PRIVATE_SCREENS, ...PUBLIC_SCREENS },
      "MAIN",
      TAB_SCREENS,
    ),
  },
};

export const AppNavigator = observer(
  forwardRef<NavigationContainerRef<ScreenParamList>, IProps>(
    ({ onReady }, ref) => {
      const { theme } = useTheme();
      const safeAreaInsets = useSafeAreaInsets();
      const { isAuthorized } = useSessionDataStore();

      const navigatorTheme = useMemo<ReactNavigation.Theme>(() => {
        return {
          dark: true,
          colors: {
            background: theme.color.background,
            text: theme.color.common.white,
            notification: "red",
            card: theme.color.grey.grey700,
            border: theme.color.grey.grey700,
            primary: theme.color.common.white,
          },
          fonts: {} as any,
        };
      }, [
        theme.color.background,
        theme.color.common.white,
        theme.color.grey.grey700,
      ]);

      const routes = useMemo(() => {
        if (isAuthorized) {
          return { ...PRIVATE_SCREENS, ...PUBLIC_SCREENS };
        }

        return PUBLIC_SCREENS;
      }, [isAuthorized]);

      return (
        <HoldItemProvider safeAreaInsets={safeAreaInsets}>
          <NavigationContainer
            ref={ref}
            linking={linking}
            onReady={onReady}
            theme={navigatorTheme}
          >
            <StackNavigation routes={routes} screenOptions={options} />
          </NavigationContainer>
        </HoldItemProvider>
      );
    },
  ),
);
