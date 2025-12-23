import {
  AppTabScreens,
  ScreenName,
  ScreenParamList,
  StackScreens,
} from "@core";
import { LinkingOptions, PathConfigMap } from "@react-navigation/native";
import { Linking } from "react-native";
import Config from "react-native-config";

import { TAB_SCREENS } from "../screens";
import { PRIVATE_SCREENS, PUBLIC_SCREENS } from "./App.screens";

const deeplinkBaseUrl = Config.DEEPLINK_BASE_URL;

const getPathMap = (
  screens: StackScreens | AppTabScreens,
  tabsScreenName?: ScreenName,
  tabScreens?: AppTabScreens,
) =>
  Object.keys(screens).reduce<PathConfigMap<ScreenParamList>>((acc, _key) => {
    const key = _key as ScreenName;

    if (tabsScreenName && tabScreens && key === tabsScreenName) {
      acc[key] = {
        screens: {
          ...getPathMap(tabScreens),
        },
      };
    } else {
      acc[key] = key.toLowerCase();
    }

    return acc;
  }, {});

export const linking: LinkingOptions<ScreenParamList> = {
  prefixes: [`${deeplinkBaseUrl}://`],

  async getInitialURL() {
    const url = await Linking.getInitialURL();

    return url?.toLowerCase();
  },
  // Функция подписки на изменения URL (включая уведомления)
  subscribe(listener) {
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      console.log("url.toLowerCase()", url.toLowerCase());
      listener(url.toLowerCase());
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
