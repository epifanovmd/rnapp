import { ParamListBase } from "@react-navigation/routers";

import { IPdfViewProps, IWebViewProps } from "../../screens";

export enum TabScreenName {
  MAIN = "MAIN",

  Main = "Main",
  Playground = "Playground",
}

interface TabScreenParams {
  MAIN: undefined;

  Posts: undefined;
  Playground: undefined;
}

export enum StackScreenName {
  SignIn = "SignIn",
  SignUp = "SignUp",
  RecoveryPassword = "RecoveryPassword",
  Notifications = "Notifications",
  Gallery = "Gallery",
  Pickers = "Pickers",
  Components = "Components",
  Modals = "Modals",
  Lottie = "Lottie",
  ChatScreen = "ChatScreen",
  Carousel = "Carousel",
  PdfView = "PdfView",
  WebView = "WebView",
}

interface StackScreenParams {
  SignIn: undefined;
  SignUp: undefined;
  RecoveryPassword: undefined;
  Notifications: undefined;
  Gallery: undefined;
  Pickers: undefined;
  Components: undefined;
  Modals: undefined;
  Lottie: undefined;
  ChatScreen: undefined;
  Carousel: undefined;
  PdfView: IPdfViewProps;
  WebView: IWebViewProps;
}

export type ScreenName =
  | keyof typeof TabScreenName
  | keyof typeof StackScreenName;

interface ScreenParamsTypesMap
  extends ParamListBase,
    TabScreenParams,
    StackScreenParams {}

export type ScreenParamList = { [K in ScreenName]: ScreenParamsTypesMap[K] };
