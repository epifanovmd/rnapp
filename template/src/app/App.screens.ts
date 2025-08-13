import { StackScreens } from "@core";
import { CardStyleInterpolators } from "@react-navigation/stack";

import {
  CarouselScreen,
  ChatScreen,
  Components,
  Modals,
  Notifications,
  PdfView,
  Pickers,
  RecoveryPassword,
  SignIn,
  SignUp,
  TabScreens,
  WebView,
} from "../screens";
import { Gallery } from "../screens/stack/Gallery";
import { Lottie } from "../screens/stack/Lottie";

export const PRIVATE_SCREENS: StackScreens = {
  MAIN: { screen: TabScreens, options: { headerShown: false } },

  Notifications: { screen: Notifications },
  Gallery: { screen: Gallery },
  Pickers: { screen: Pickers },
  Components: { screen: Components },
  Modals: { screen: Modals },
  Lottie: { screen: Lottie },
  ChatScreen: {
    screen: ChatScreen,
    options: { headerShown: false, title: "Чат" },
  },
  Carousel: { screen: CarouselScreen },
  PdfView: {
    screen: PdfView,
    options: {
      cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
      gestureEnabled: false,
      headerShown: false,
    },
  },
  WebView: {
    screen: WebView,
    options: {
      cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
      gestureEnabled: false,
      headerShown: false,
    },
  },
};

export const PUBLIC_SCREENS: StackScreens = {
  SignIn: { screen: SignIn, options: { headerShown: false } },
  SignUp: { screen: SignUp, options: { headerShown: false } },
  RecoveryPassword: {
    screen: RecoveryPassword,
    options: { headerShown: false },
  },
};
