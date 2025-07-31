import { CardStyleInterpolators } from "@react-navigation/stack";

import { StackScreens } from "../navigation";
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
  MAIN: { screen: TabScreens },

  Notifications: { screen: Notifications },
  Gallery: { screen: Gallery },
  Pickers: { screen: Pickers },
  Components: { screen: Components },
  Modals: { screen: Modals },
  Lottie: { screen: Lottie },
  ChatScreen: { screen: ChatScreen },
  Carousel: { screen: CarouselScreen },
  PdfView: {
    screen: PdfView,
    options: {
      cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
      gestureEnabled: false,
    },
  },
  WebView: {
    screen: WebView,
    options: {
      cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
      gestureEnabled: false,
    },
  },
};

export const PUBLIC_SCREENS: StackScreens = {
  SignIn: { screen: SignIn },
  SignUp: { screen: SignUp },
  RecoveryPassword: { screen: RecoveryPassword },
};
