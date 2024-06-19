export enum TabScreenName {
  MAIN = "MAIN",

  Playground = "Playground",
  Users = "Users",
}

interface TabScreenParams {
  MAIN: any;
  Playground: any;
  Users: any;
}

export enum StackScreenName {
  Authorization = "Authorization",
  Notifications = "Notifications",
  Pickers = "Pickers",
  Components = "Components",
}

interface StackScreenParams {
  Authorization: any;
  Notifications: any;
  Pickers: any;
  Components: any;
}

export type ScreenName =
  | keyof typeof TabScreenName
  | keyof typeof StackScreenName;

interface ScreenParamsTypesMap extends TabScreenParams, StackScreenParams {}

export type ScreenParamList = { [K in ScreenName]: ScreenParamsTypesMap[K] };
