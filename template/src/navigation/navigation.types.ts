import { ParamListBase } from "@react-navigation/routers";

import { IPdfViewProps, IWebViewProps } from "../screens";

export enum TabScreenName {
  MAIN = "MAIN",

  Main = "Main",
  Chats = "Chats",
  Contacts = "Contacts",
  Playground = "Playground",
  Settings = "Settings",
}

interface TabScreenParams {
  MAIN: undefined;

  Posts: undefined;
  Chats: undefined;
  Contacts: undefined;
  Playground: undefined;
  Settings: undefined;
}

export enum StackScreenName {
  SignIn = "SignIn",
  SignUp = "SignUp",
  RecoveryPassword = "RecoveryPassword",
  Components = "Components",
  Carousel = "Carousel",
  PdfView = "PdfView",
  WebView = "WebView",
  ChatRoom = "ChatRoom",
  NewChat = "NewChat",
  NewGroupChat = "NewGroupChat",
  ChatInfo = "ChatInfo",
}

interface StackScreenParams {
  SignIn: undefined;
  SignUp: undefined;
  RecoveryPassword: undefined;
  Components?: {
    initialRouteName: keyof typeof ComponentsScreenName;
  };
  Carousel: undefined;
  PdfView: IPdfViewProps;
  WebView: IWebViewProps;
  ChatRoom: { chatId: string };
  NewChat: undefined;
  NewGroupChat: undefined;
  ChatInfo: { chatId: string };
}

export enum ComponentsScreenName {
  Buttons = "Buttons",
  Notifications = "Notifications",
  Modals = "Modals",
  Pickers = "Pickers",
  Elements = "Elements",
  Ticket = "Elements",
}

interface ComponentsScreenParams {
  Buttons: undefined;
  Notifications: undefined;
  Modals: undefined;
  Pickers: undefined;
  Elements: undefined;
  Ticket: undefined;
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
