import { isString } from "@force-dev/utils";
import notifee from "@notifee/react-native";
import { EventType } from "@notifee/react-native/src/types/Notification";
import { LinkingOptions, PathConfigMap } from "@react-navigation/native";
import { Linking } from "react-native";
import Config from "react-native-config";

import {
  AppTabScreens,
  ScreenName,
  ScreenParamList,
  StackScreens,
} from "../navigation";
import { TAB_SCREENS } from "../screens";
import { PRIVATE_SCREENS, PUBLIC_SCREENS } from "./App.screens";

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

export const linking: LinkingOptions<ScreenParamList> = {
  prefixes: [`${deeplinkBaseUrl}://`],

  async getInitialURL() {
    return Linking.getInitialURL();
  },
  // Функция подписки на изменения URL (включая уведомления)
  subscribe(listener) {
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
