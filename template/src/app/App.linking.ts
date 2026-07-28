import { LinkingOptions, PathConfigMap } from "@react-navigation/native";
import { DEEPLINK_BASE_URL } from "@shared/config/env";
import {
  AppTabScreens,
  ScreenName,
  ScreenParamList,
  StackScreens,
} from "@shared/lib/navigation";
import { Linking } from "react-native";

import { PRIVATE_SCREENS, PUBLIC_SCREENS } from "./App.screens";
import { TAB_SCREENS } from "./app-tab-screens";

const deeplinkBaseUrl = DEEPLINK_BASE_URL;

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
