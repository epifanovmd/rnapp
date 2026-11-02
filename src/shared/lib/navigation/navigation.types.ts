import type { StaticScreenProps } from "@react-navigation/native";
import { createInjectDecorator } from "@shared/lib/di";

/**
 * Глобальный param list приложения. Наполняется в `app/App.navigator.tsx`
 * через declaration merging (`RootNavigator` из `@react-navigation/core`)
 * из static-конфига корневого навигатора — shared конкретных экранов не знает.
 * Re-mapping снимает interface-ограничение на index signature.
 */
export type RootParamList = {
  [K in keyof ReactNavigation.RootParamList]: ReactNavigation.RootParamList[K];
};

export type RouteName = keyof RootParamList;

/** Кортеж аргументов навигации: params обязателен только у экранов с параметрами. */
export type NavigateArgs<Name extends RouteName> =
  undefined extends RootParamList[Name]
    ? [name: Name, params?: RootParamList[Name]]
    : [name: Name, params: RootParamList[Name]];

/**
 * Пропсы экрана static-конфига. Параметры экрана объявляются рядом со
 * страницей: `type Props = ScreenProps<{ id: string }>` — root param list
 * выводится из них автоматически.
 */
export type ScreenProps<
  Params extends Record<string, unknown> | undefined = undefined,
> = StaticScreenProps<Params>;

export interface NavigationPathEntry {
  screen: string;
  params?: object;
}

export const INavigationService =
  createInjectDecorator<INavigationService>("INavigationService");

/** Императивная навигация вне React (сервисы, сторы); в компонентах — useNavigation(). */
export interface INavigationService {
  readonly isReady: boolean;
  readonly canGoBack: boolean;
  /** Имя сфокусированного экрана. */
  readonly currentRouteName: RouteName | undefined;
  /** Цепочка сфокусированных маршрутов от корня до активного экрана. */
  readonly activePath: ReadonlyArray<NavigationPathEntry>;

  /** Подписка на state контейнера (MobX-реактивность полей); возвращает отписку. */
  subscribe(): () => void;
  navigate<Name extends RouteName>(...args: NavigateArgs<Name>): void;
  push<Name extends RouteName>(...args: NavigateArgs<Name>): void;
  replace<Name extends RouteName>(...args: NavigateArgs<Name>): void;
  goBack(): void;
  /** Сброс корневого стека к одному экрану (например, после logout). */
  resetTo<Name extends RouteName>(...args: NavigateArgs<Name>): void;
}
