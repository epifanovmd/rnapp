import { StackScreens } from "../navigation";
import {
  CarouselScreen,
  ChatScreen,
  Components,
  Modals,
  Notifications,
  Pickers,
  RecoveryPassword,
  SignIn,
  SignUp,
  TabScreens,
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
};

export const PUBLIC_SCREENS: StackScreens = {
  SignIn: { screen: SignIn },
  SignUp: { screen: SignUp },
  RecoveryPassword: { screen: RecoveryPassword },
};
