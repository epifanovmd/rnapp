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
  Gallery = "Gallery",
  Components = "Components",
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
  Gallery: undefined;
  Components?: {
    initialRouteName: keyof typeof ComponentsScreenName;
  };
  Lottie: undefined;
  ChatScreen: undefined;
  Carousel: undefined;
  PdfView: IPdfViewProps;
  WebView: IWebViewProps;
}

export enum ComponentsScreenName {
  Buttons = "Buttons",
  Notifications = "Notifications",
  Modals = "Modals",
  Pickers = "Pickers",
  ElementsTab = "ElementsTab",
}

interface ComponentsScreenParams {
  Buttons: undefined;
  Notifications: undefined;
  Modals: undefined;
  Pickers: undefined;
  ElementsTab: undefined;
}

export type ScreenName =
  | keyof typeof TabScreenName
  | keyof typeof ComponentsScreenName
  | keyof typeof StackScreenName;

interface ScreenParamsTypesMap
  extends ParamListBase,
    TabScreenParams,
    StackScreenParams,
    ComponentsScreenParams {}

export type ScreenParamList = { [K in ScreenName]: ScreenParamsTypesMap[K] };
