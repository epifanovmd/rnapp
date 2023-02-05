export enum MainScreenName {
  MAIN = 'MAIN',

  Page1 = 'Page1',
  Page2 = 'Page2',
}

interface MainScreenParams {
  MAIN: any;
  Page1: any;
  Page2: any;
}

export enum OtherScreenName {
  OtherFirstScreen = 'OtherFirstScreen',
  OtherSecondScreen = 'OtherSecondScreen',
}

interface OtherScreenParams {
  OtherFirstScreen: any;
  OtherSecondScreen: any;
}

export type ScreenName =
  | keyof typeof MainScreenName
  | keyof typeof OtherScreenName;

interface ScreenParamsTypesMap extends MainScreenParams, OtherScreenParams {}

export type ScreenParamsTypes = {[K in ScreenName]: ScreenParamsTypesMap[K]};
