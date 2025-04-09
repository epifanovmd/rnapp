import { StackScreens } from "../navigation";
import {
  Authorization,
  CarouselScreen,
  ChatScreen,
  Components,
  Modals,
  Notifications,
  Pickers,
  PostScreen,
  TabScreens,
} from "../screens";
import { Gallery } from "../screens/stack/Gallery";
import { Lottie } from "../screens/stack/Lottie";

export const PRIVATE_SCREENS: StackScreens = {
  MAIN: { screen: TabScreens },

  Post: { screen: PostScreen },
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
  Authorization: { screen: Authorization },
};
