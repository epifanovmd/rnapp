import { StackActions } from "@react-navigation/native";
import type { NavigationState, PartialState } from "@react-navigation/routers";
import { injectable } from "inversify";
import { action, makeObservable, observable } from "mobx";

import { DebugVars } from "../../../../debugVars";
import { navigationRef } from "./navigation.ref";
import {
  INavigationService,
  NavigateArgs,
  NavigationPathEntry,
  RouteName,
} from "./navigation.types";

type AnyNavigationState =
  NavigationState | PartialState<NavigationState> | undefined;

/** Цепочка сфокусированных маршрутов: от корня вниз по `routes[index]`. */
const collectActivePath = (
  state: AnyNavigationState,
): NavigationPathEntry[] => {
  const path: NavigationPathEntry[] = [];
  let current: AnyNavigationState = state;

  while (current) {
    const route = current.routes[current.index ?? current.routes.length - 1];

    if (!route) {
      break;
    }

    path.push({ screen: route.name, params: route.params });
    current = route.state;
  }

  return path;
};

/**
 * Императивная навигация поверх navigationRef. Типизация — из глобального
 * RootParamList; `navigate` контейнера типизирован перегрузками по экранам,
 * union-вызов по ним не дистрибутируется, поэтому внутри — суженная сигнатура
 * (безопасность обеспечивают типы `NavigateArgs` публичного API).
 */
@injectable()
export class NavigationService implements INavigationService {
  currentRouteName: RouteName | undefined = undefined;
  activePath: NavigationPathEntry[] = [];

  constructor() {
    makeObservable(this, {
      currentRouteName: observable.ref,
      activePath: observable.ref,
    });
  }

  get isReady(): boolean {
    return navigationRef.isReady();
  }

  get canGoBack(): boolean {
    return this.isReady && navigationRef.canGoBack();
  }

  subscribe(): () => void {
    this._syncState();

    return navigationRef.addListener("state", this._syncState);
  }

  navigate<Name extends RouteName>(
    ...[name, params]: NavigateArgs<Name>
  ): void {
    if (this.isReady) {
      const navigate = navigationRef.navigate as (
        name: RouteName,
        params?: object,
      ) => void;

      navigate(name, params);
    }
  }

  push<Name extends RouteName>(...[name, params]: NavigateArgs<Name>): void {
    if (this.isReady) {
      navigationRef.dispatch(StackActions.push(name, params));
    }
  }

  replace<Name extends RouteName>(...[name, params]: NavigateArgs<Name>): void {
    if (this.isReady) {
      navigationRef.dispatch(StackActions.replace(name, params));
    }
  }

  goBack(): void {
    if (this.canGoBack) {
      navigationRef.goBack();
    }
  }

  resetTo<Name extends RouteName>(...[name, params]: NavigateArgs<Name>): void {
    if (this.isReady) {
      navigationRef.resetRoot({ index: 0, routes: [{ name, params }] });
    }
  }

  private readonly _syncState = action(() => {
    if (!navigationRef.isReady()) {
      return;
    }

    this.currentRouteName = navigationRef.getCurrentRoute()?.name as
      RouteName | undefined;
    this.activePath = collectActivePath(navigationRef.getRootState());

    if (DebugVars.logNavHistory) {
      console.log("Nav current screen ->", this.currentRouteName);
      console.log("Nav active path ->", JSON.stringify(this.activePath));
    }
  });
}
