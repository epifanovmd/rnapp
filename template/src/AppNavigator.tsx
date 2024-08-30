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
  Components,
  Notifications,
  Pickers,
  PostScreen,
  TAB_SCREENS,
  TabScreens,
} from "./screens";

interface IProps {
  onReady?: () => void;
}

export const SCREENS: StackScreens = {
  MAIN: { screen: TabScreens },

  Post: { screen: PostScreen },
  Authorization: { screen: Authorization },
  Notifications: { screen: Notifications },
  Pickers: { screen: Pickers },
  Components: { screen: Components },
};

const options: StackScreenOption = {
  animationEnabled: true,
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

  // Custom function to get the URL which was used to open the app
  async getInitialURL() {
    // // First, you would need to get the initial URL from your third-party integration
    // // The exact usage depend on the third-party SDK you use
    // // For example, to get the initial URL for Firebase Dynamic Links:
    // const {isAvailable} = utils().playServicesAvailability;
    //
    // if (isAvailable) {
    //   const initialLink = await dynamicLinks().getInitialLink();
    //
    //   if (initialLink) {
    //     return initialLink.url;
    //   }
    // }
    //
    // // As a fallback, you may want to do the default deep link handling
    return await Linking.getInitialURL();
  },

  // Custom function to subscribe to incoming links
  subscribe: listener => {
    // // Listen to incoming links from Firebase Dynamic Links
    // const unsubscribeFirebase = dynamicLinks().onLink(({url}) => {
    //   listener(url);
    // });

    // Listen to incoming links from deep linking
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      listener(url);
    });

    return () => {
      // Clean up the event listeners
      // unsubscribeFirebase();
      linkingSubscription.remove();
    };
  },

  config: {
    // Deep link configuration
    screens: getPathMap(SCREENS, "MAIN", TAB_SCREENS),
  },
};

export const AppNavigator = observer(
  forwardRef<NavigationContainerRef<ScreenParamList>, IProps>(
    ({ onReady }, ref) => {
      const { theme } = useTheme();
      const safeAreaInsets = useSafeAreaInsets();

      const navigatorTheme = useMemo(() => {
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
        };
      }, [
        theme.color.background,
        theme.color.common.white,
        theme.color.grey.grey700,
      ]);

      return (
        <HoldItemProvider safeAreaInsets={safeAreaInsets}>
          <NavigationContainer
            ref={ref}
            linking={linking}
            onReady={onReady}
            theme={navigatorTheme}
          >
            <StackNavigation routes={SCREENS} screenOptions={options} />
          </NavigationContainer>
        </HoldItemProvider>
      );
    },
  ),
);
