import { StackScreens } from "@navigation";
import { CardStyleInterpolators } from "@react-navigation/stack";

import {
  CarouselScreen,
  ChatInfo,
  ChatRoom,
  Components,
  NewChat,
  NewGroupChat,
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

  // Messenger screens
  ChatRoom: { screen: ChatRoom, options: { headerShown: false } },
  NewChat: { screen: NewChat, options: { headerShown: false } },
  NewGroupChat: { screen: NewGroupChat, options: { headerShown: false } },
  ChatInfo: { screen: ChatInfo, options: { headerShown: false } },
};

export const PUBLIC_SCREENS: StackScreens = {
  SignIn: { screen: SignIn, options: { headerShown: false } },
  SignUp: { screen: SignUp, options: { headerShown: false } },
  RecoveryPassword: {
    screen: RecoveryPassword,
    options: { headerShown: false },
  },
};
