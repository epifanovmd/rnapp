import { CarouselScreen } from "@pages/stack/carousel";
import { Charts } from "@pages/stack/charts";
import { ChatRoom } from "@pages/stack/chat";
import { Components } from "@pages/stack/components";
import { ContainerScanner } from "@pages/stack/container-scanner";
import { ContextMenu } from "@pages/stack/context-menu";
import { InputBar } from "@pages/stack/input-bar";
import { PdfView } from "@pages/stack/pdf-view";
import { PlateScanner } from "@pages/stack/plate-scanner";
import { RecoveryPassword } from "@pages/stack/recovery-password";
import { SignIn } from "@pages/stack/sign-in";
import { SignUp } from "@pages/stack/sign-up";
import { TextScanner } from "@pages/stack/text-scanner";
import { WebView } from "@pages/stack/web-view";
import { CardStyleInterpolators } from "@react-navigation/stack";
import { StackScreens } from "@shared/lib/navigation";

import { TabScreens } from "./app-tab-screens";

export const PRIVATE_SCREENS: StackScreens = {
  MAIN: { screen: TabScreens, options: { headerShown: false } },

  Components: { screen: Components, options: { headerShown: false } },
  Carousel: { screen: CarouselScreen },
  Chat: { screen: ChatRoom, options: { headerShown: false } },
  Charts: { screen: Charts },
  ContextMenu: { screen: ContextMenu },
  InputBar: { screen: InputBar },
  ContainerScanner: {
    screen: ContainerScanner,
    options: { headerShown: false },
  },
  PlateScanner: { screen: PlateScanner, options: { headerShown: false } },
  TextScanner: { screen: TextScanner, options: { headerShown: false } },
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
