import { Charts } from "@pages/stack/charts";
import { Components } from "@pages/stack/components";
import { ContainerScanner } from "@pages/stack/container-scanner";
import { ContextMenu } from "@pages/stack/context-menu";
import { InputBar } from "@pages/stack/input-bar";
import { ObjectScanner } from "@pages/stack/object-scanner";
import { PdfView } from "@pages/stack/pdf-view";
import { PlateScanner } from "@pages/stack/plate-scanner";
import { RecoveryPassword } from "@pages/stack/recovery-password";
import { SignIn } from "@pages/stack/sign-in";
import { SignUp } from "@pages/stack/sign-up";
import { TextScanner } from "@pages/stack/text-scanner";
import { WebView } from "@pages/stack/web-view";
import type { PathConfig } from "@react-navigation/core";
import type { ParamListBase } from "@react-navigation/routers";
import {
  CardStyleInterpolators,
  createStackNavigator,
  StackNavigationOptions,
} from "@react-navigation/stack";

import { AppHeader } from "./App.header";
import { MainTabs, MainTabsLayout } from "./app-tab-screens";
import { stackTransition } from "./common";
import { useIsSignedIn, useIsSignedOut } from "./hooks";

const NO_HEADER: StackNavigationOptions = { headerShown: false };

/** alias "SignIn" — зарегистрированный redirect_uri GitHub OAuth. */
const SIGN_IN_LINKING: PathConfig<ParamListBase> = {
  path: "signin",
  alias: ["SignIn"],
};

const MODAL_OPTIONS: StackNavigationOptions = {
  cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
  gestureEnabled: false,
  headerShown: false,
};

/**
 * Static-конфиг корневого стека (RN7): группы с guard'ами — экраны доступны
 * только при подходящем auth-состоянии, при его смене RN сам переключает стек.
 * Параметры экранов объявляются на страницах (`ScreenProps<...>`), типы и
 * linking-конфиг выводятся отсюда автоматически.
 */
export const RootStack = createStackNavigator({
  screenOptions: {
    gestureEnabled: true,
    cardOverlayEnabled: true,
    cardStyleInterpolator: stackTransition,
    headerShown: true,
    header: AppHeader,
  },
  groups: {
    Private: {
      if: useIsSignedIn,
      screens: {
        Tabs: {
          screen: MainTabs,
          options: NO_HEADER,
          layout: MainTabsLayout,
        },
        Components: {
          screen: Components,
          options: NO_HEADER,
          linking: "components",
        },
        Charts: { screen: Charts, linking: "charts" },
        ContextMenu: { screen: ContextMenu, linking: "contextmenu" },
        InputBar: { screen: InputBar, linking: "inputbar" },
        ContainerScanner: {
          screen: ContainerScanner,
          options: NO_HEADER,
          linking: "containerscanner",
        },
        PlateScanner: {
          screen: PlateScanner,
          options: NO_HEADER,
          linking: "platescanner",
        },
        TextScanner: {
          screen: TextScanner,
          options: NO_HEADER,
          linking: "textscanner",
        },
        ObjectScanner: {
          screen: ObjectScanner,
          options: NO_HEADER,
          linking: "objectscanner",
        },
        PdfView: {
          screen: PdfView,
          options: MODAL_OPTIONS,
          linking: "pdfview",
        },
        WebView: {
          screen: WebView,
          options: MODAL_OPTIONS,
          linking: "webview",
        },
      },
    },
    Public: {
      if: useIsSignedOut,
      screens: {
        SignIn: {
          screen: SignIn,
          options: NO_HEADER,
          linking: SIGN_IN_LINKING,
        },
        SignUp: { screen: SignUp, options: NO_HEADER, linking: "signup" },
        RecoveryPassword: {
          screen: RecoveryPassword,
          options: NO_HEADER,
          linking: "recoverypassword",
        },
      },
    },
  },
});
