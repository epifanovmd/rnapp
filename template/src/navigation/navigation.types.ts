export enum TabScreenName {
  MAIN = "MAIN",

  Posts = "Posts",
  Playground = "Playground",
}

interface TabScreenParams {
  MAIN: any;

  Posts: any;
  Playground: any;
}

export enum StackScreenName {
  Authorization = "Authorization",
  Notifications = "Notifications",
  Pickers = "Pickers",
  Components = "Components",
  Modals = "Modals",
  ChatScreen = "ChatScreen",

  Post = "Post",
}

interface StackScreenParams {
  Authorization: any;
  Notifications: any;
  Pickers: any;
  Components: any;
  Modals: any;
  ChatScreen: any;

  Post: { id: number };
}

export type ScreenName =
  | keyof typeof TabScreenName
  | keyof typeof StackScreenName;

interface ScreenParamsTypesMap extends TabScreenParams, StackScreenParams {}

export type ScreenParamList = { [K in ScreenName]: ScreenParamsTypesMap[K] };
