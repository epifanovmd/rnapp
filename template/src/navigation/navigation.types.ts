import { ParamListBase } from "@react-navigation/routers";

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
}

export type ScreenName =
  | keyof typeof TabScreenName
  | keyof typeof StackScreenName;

interface ScreenParamsTypesMap
  extends ParamListBase,
    TabScreenParams,
    StackScreenParams {}

export type ScreenParamList = { [K in ScreenName]: ScreenParamsTypesMap[K] };
