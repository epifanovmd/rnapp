import { StackScreens } from "@core";
import { CardStyleInterpolators } from "@react-navigation/stack";

import {
  CarouselScreen,
  Components,
  PdfView,
  RecoveryPassword,
  SignIn,
  SignUp,
  TabScreens,
  WebView,
} from "../screens";

export const PRIVATE_SCREENS: StackScreens = {
  MAIN: { screen: TabScreens, options: { headerShown: false } },

  Components: { screen: Components, options: { headerShown: false } },
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
