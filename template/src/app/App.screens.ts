import { RecoveryPassword } from "@pages/recovery-password";
import { SignIn } from "@pages/sign-in";
import { SignUp } from "@pages/sign-up";
import {
  CarouselScreen,
  Components,
  PdfView,
  WebView,
} from "@pages/ui-kit-demo";
import { CardStyleInterpolators } from "@react-navigation/stack";
import { StackScreens } from "@shared/lib/navigation";

import { TabScreens } from "./app-tab-screens";

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
