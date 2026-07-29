import { NavigationContainerRef } from "@react-navigation/native";
import { createInjectDecorator } from "@shared/lib/di";

import { ScreenName, ScreenParamList } from "./navigation.types";

export const INavigationService =
  createInjectDecorator<INavigationService>("INavigationService");

export interface INavigationService {
  readonly history: {
    screen: ScreenName;
    params: ScreenParamList[ScreenName];
  }[];
  readonly currentScreenName: ScreenName | undefined;
  readonly isReady: boolean;
  readonly canGoBack: boolean;

  subscribe(): () => void;
  goBack(): void;
  navigateTo: NavigationContainerRef<ScreenParamList>["navigate"];
  replaceTo<T extends ScreenName>(name: T, params: ScreenParamList[T]): void;
  pushTo<T extends ScreenName>(name: T, params: ScreenParamList[T]): void;
}
