export enum TabScreenName {
  MAIN = 'MAIN',

  Page1 = 'Page1',
  Page2 = 'Page2',
}

interface TabScreenParams {
  MAIN: any;
  Page1: any;
  Page2: any;
}

export enum StackScreenName {
  OtherFirstScreen = 'OtherFirstScreen',
  OtherSecondScreen = 'OtherSecondScreen',
}

interface StackScreenParams {
  OtherFirstScreen: any;
  OtherSecondScreen: any;
}

export type ScreenName =
  | keyof typeof TabScreenName
  | keyof typeof StackScreenName;

interface ScreenParamsTypesMap extends TabScreenParams, StackScreenParams {}

export type ScreenParamsTypes = {[K in ScreenName]: ScreenParamsTypesMap[K]};
