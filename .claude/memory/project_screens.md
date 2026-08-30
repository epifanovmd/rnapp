---
name: Screens & Navigation
description: Экраны, навигация (RN7 static API), NavigationService
type: project
---

- Навигация — React Navigation 7 **static API**: `app/App.screens.ts` —
  `RootStack = createStackNavigator({ groups })` с guard-группами
  `Private` (`if: useIsSignedIn`) / `Public` (`if: useIsSignedOut`); при смене
  auth-состояния стек переключается автоматически (ручной navigate после
  login/logout не нужен).
- `src/pages/` сгруппированы по навигаторам: `pages/tabs/<slice>` и `pages/stack/<slice>`
  (boundaries-паттерн `src/pages/*/*/**`, capture group+slice).
- **Public** (`pages/stack/`): SignIn, SignUp, RecoveryPassword.
- **Private — табы** (`Tabs`, `src/app/app-tab-screens.tsx` → `MainTabs`, `pages/tabs/`):
  Main, Playground, Settings.
- **Private — стек** (`src/app/App.screens.ts`, `pages/stack/`): Tabs + Components/
  Charts/Chat/ContainerScanner/ContextMenu/InputBar/ObjectScanner/PdfView/PlateScanner/
  TextScanner/WebView.
- **Chat** (`pages/stack/chat`) — тонкая страница: моковые сообщения (`useChatMessages`)
  + `ChatView` из `widgets/chat`; позиция скролла живёт в MMKV по `chatId`.
- Типизация: глобальный `ReactNavigation.RootParamList` выводится из static-конфига
  (регистрация `RootNavigator` в `App.navigator.tsx`); параметры экрана — рядом со
  страницей через `ScreenProps<Params>`; central param-list'ов/enum'ов нет.
  Вложенные top-tabs `Components` — локальный param list
  (`pages/stack/components/components.types.ts`).
- `shared/lib/navigation/` — только инфраструктура: `navigationRef`, `NavigationService`
  (императивная навигация вне React, MobX `currentRouteName`/`activePath`),
  `useNavigation()`/`useRoute<Name>()`.
- Бутстрап (restore, биометрия, splash) — `app/hooks/useAppBootstrap.ts` (onReady).
- Deep linking — пути в static-конфиге (`linking:` у экранов), `app/App.linking.ts` —
  prefixes + `enabled: "auto"`.
