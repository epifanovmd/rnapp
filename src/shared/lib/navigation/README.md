---
module: shared/lib/navigation
summary: Типизированная навигация поверх React Navigation — общий ref контейнера, INavigationService вне React, хуки экранов, готовность экрана после анимации перехода.
---

# navigation

Навигационная инфраструктура без знания конкретных экранов: типы маршрутов выводятся
из static-конфига корневого навигатора в `app`.

## Public API

| Группа     | Экспорт                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| типы       | `RootParamList`, `RouteName`, `NavigateArgs`, `ScreenProps<Params>`, `NavigationPathEntry`                                                                                                        |
| ref        | `navigationRef` — единственный ref контейнера                                                                                                                                                     |
| сервис     | `INavigationService` (`navigate`, `push`, `replace`, `goBack`, `resetTo`, `currentRouteName`, `activePath`, `subscribe`), `navigationModule`                                                      |
| хуки       | `useNavigation`, `useRoute<Name>()`, `useLeaveConfirmation({ when, dialog?, onConfirm? })`                                                                                                        |
| готовность | `useScreenReady`, `screenReadiness` (`isReady`, `whenReady`, `whenRouteReady`, `onRouteReady`…), `createScreenReadiness`, `screenTransitionListeners`, `createTransitionTracker`, `findRoutePath` |

## Устройство

- `RootParamList` наполняется в `app/App.navigator.tsx` через declaration merging
  (`ReactNavigation.RootParamList`); параметры экрана объявляются рядом со страницей:
  `type Props = ScreenProps<{ id: string }>`.
- `navigationRef` передаётся в `NavigationContainer` и используется `NavigationService`.
  `app` вызывает `navigationService.subscribe()` — сервис держит `currentRouteName` и
  `activePath` в MobX (`observable.ref`).
- Методы сервиса — no-op, пока контейнер не готов (`isReady`); `goBack` — только при
  `canGoBack`.
- Готовность экрана (`screen-ready/`): экран активен на каждом уровне дерева и анимация
  открытия ближайшего экрана стека завершилась. Анимации запоминает трекер, которого
  питает `screenTransitionListeners` — подключён как `screenListeners` в
  `app/App.screens.ts`.
- `useScreenReady` — до готовности экран рисует скелетон, тяжёлый контент монтируется
  после перехода; по умолчанию `once: true`.

## Зависимости

- `@react-navigation/native`, `mobx`, `@shared/lib/di`, `@shared/lib/hooks`.
- Потребители: `app` (контейнер, экраны, модуль), `pages/stack`, `pages/tabs`,
  `widgets/app-menu`, `features/edit-profile`, `shared/ui`.

## Gotcha

- Вложенный экран (вкладка внутри экрана стека) может смонтироваться позже
  `transitionEnd` — поэтому трекер помнит завершённые анимации, а не ждёт событие.
- Стек без `screenTransitionListeners` событий не шлёт: готовность наступит только по
  страховочному `timeout` (по умолчанию 1000 мс).
- Экрана нет в дереве — `whenReady(routeKey)` готов сразу, а `isRouteReady(name)` — нет.
- `useLeaveConfirmation.when` может быть функцией — она читается в момент ухода
  (удобно для MobX-флагов без ре-рендера).
