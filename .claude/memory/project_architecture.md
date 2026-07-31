---
name: Project Architecture
description: React Native template app — структура, стек, IoC, навигация, state, API, socket, тема
type: project
---

## Project Structure

Feature-Sliced Design: `app → pages → widgets → features → entities → shared`. Each layer may import
only from layers strictly below it (`app` sees everything); slices in the same layer never import each
other directly (`eslint-plugin-boundaries`, `eslint.boundaries.mjs`).

```
template/src/
├── app/                     # композиционный корень
│   ├── App.tsx              # Root: providers (Theme, SafeArea, BottomSheet, Keyboard, Dialog.Host, ContextMenuView.Host)
│   ├── App.navigator.tsx    # NavigationContainer + auth state → routes = PUBLIC or PRIVATE+PUBLIC
│   ├── App.screens.ts       # PUBLIC_SCREENS (SignIn, SignUp, RecoveryPassword) + PRIVATE_SCREENS
│   ├── app-tab-screens.tsx  # TAB_SCREENS манифест (Chats, Main, Playground, Settings)
│   ├── App.linking.ts       # Deep linking config (react-navigation linking)
│   ├── App.notifications.tsx
│   ├── app.module.ts        # registerContainerModules() — регистрирует все *.module.ts в IoC
│   ├── app-data-store.ts, app-data-types.ts, app-data.module.ts   # app-level bootstrap store
│   ├── common/               # stack-transition.ts (card style interpolator)
│   └── hooks/                # useAppNavigationTheme
├── pages/                   # экраны — тонкая композиция widgets/features/entities под роут
│   ├── sign-in/, sign-up/, recovery-password/    # SignIn.tsx, SignUp.tsx, RecoveryPassword.tsx
│   ├── chat/                # реэкспорт ChatRoom из widgets/chat-room
│   ├── settings/            # Settings.tsx
│   └── ui-kit-demo/          # демо/плейграунд: stack/{carousel,charts,components,context-menu,pdf-view,web-view},
│                              #   tabs/{main,playground}
├── widgets/                 # крупные самостоятельные блоки UI
│   ├── chat-room/           # ChatRoom.tsx (мок-данные, useChatRoomMock), native/ (ChatView, InputBar),
│   │                          #   AttachmentPickerSheet, PollDetailModal
│   └── app-shell/           # TabBar.tsx (кастомный bottom tab bar)
├── features/                # юзкейсы поверх entities
│   ├── sign-in/, sign-up/, recovery-password/   # model/use<Xxx>VM.ts + validation.ts (zod)
│   └── biometric/            # useBiometric — общий для sign-in и settings
├── entities/                 # бизнес-сущности, без UI-форм
│   ├── auth/
│   │   ├── model/            # store.ts (AuthStore), types.ts, biometric-store.ts, passkey-store.ts,
│   │   │                      #   validation.ts (loginValidation/passwordValidation)
│   │   ├── api/               # jwt-service.ts, session-service.ts, session-guard.ts,
│   │   │                      #   token-provider.ts, token-source.ts, token-storage.ts
│   │   └── auth.module.ts
│   └── user/
│       ├── model/            # store.ts (UserStore), session-store.ts, realtime.ts, user-model.ts,
│       │                      #   profile-model.ts, public-user-model.ts, role-model.ts, session-model.ts
│       ├── lib/permissions.ts
│       └── user.module.ts
└── shared/                   # переиспользуемый код без знания о бизнес-логике
    ├── ui/                   # UI-кит (см. project_components.md)
    ├── api/                  # HttpClient (http-client.ts), api.ts (orval getRestApi()), query-race.ts,
    │                          #   api-error.ts, contract/ (ITokenSource), gen/ (сгенерировано, не редактировать)
    ├── config/                # env.ts
    └── lib/                   # di, holders, navigation, theme, socket, storage, notifications, network,
                                #   app-state, webrtc, media, transition, slots, models, utils, hooks, contracts
```

## Stack

React Native 0.86 + React 19.2 + TypeScript 5.9 + MobX 6 + React Navigation 7 + Socket.IO client 4 +
Axios + Zod 4 + react-hook-form 7 + Inversify 8 (IoC). New Architecture enabled (Fabric + TurboModules,
`fabricEnabled` on Android).

## Path Aliases

`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared` — declared in `tsconfig.json`
(`compilerOptions.paths`) and `babel.config.js` (`module-resolver` plugin), kept in sync manually. See
`project_aliases.md` for details.

## Key Rules

- `src/shared/api/gen/` — auto-generated from OpenAPI via orval, **never edit manually**
  (`npm run generate:orval`).
- No `~` alias prefix anywhere.
- No `plop`/codegen-generator script exists in this project (removed) — new files are created by hand.

## IoC (src/shared/lib/di/)

Custom decorator layer over Inversify (`create-inject-decorator.ts`, backed by
`inversify-inject-decorators` + a single `iocContainer`, see `container.ts`). Each injectable interface
gets one `createInjectDecorator<T>()` call, used both as a parameter decorator and as the accessor object:

```ts
export const IMyService = createInjectDecorator<IMyService>();

@injectable()
class MyService implements IMyService {
  constructor(@IOther() private other: IOther) {}
}

// bound in <slice>.module.ts:
export const myModule = new ContainerModule(({ bind }) => {
  bind(IMyService.Tid).to(MyService).inSingletonScope();
});

// consumed in a component (memoized via useRef under the hood):
const service = IMyService.useInstance();
// consumed outside React:
const service = IMyService.getInstance();
```

All `*.module.ts` are imported and loaded once via `iocContainer.load(...)` inside
`src/app/app.module.ts` → `registerContainerModules()`, called at the top of `src/app/App.tsx` before
the component tree renders.

## Navigation (React Navigation 7)

`src/shared/lib/navigation/` — thin wrappers: `StackNavigation.tsx`, `TabNavigation.tsx`,
`TopTabNavigation.tsx`, `AppNavigation.tsx` (generic screens-map → navigator), plus hooks
(`use-navigation.ts`, `use-route.ts`) and `NavigationService` (IoC singleton: route history array,
`navigateTo`/`pushTo`/`replaceTo`/`goBack`, `currentScreenName`, `canGoBack`).

Screen manifests are plain objects, not decorators:
- `src/app/App.screens.ts` — `PUBLIC_SCREENS` (SignIn, SignUp, RecoveryPassword) and `PRIVATE_SCREENS`
  (`MAIN` → the tab navigator, plus demo stack screens Components/Carousel/Chat/Charts/ContextMenu/PdfView/WebView).
- `src/app/app-tab-screens.tsx` — `TAB_SCREENS` rendered inside `MAIN`: Main (ui-kit-demo),
  Playground (ui-kit-demo), Settings.

`App.navigator.tsx` chooses the active route set from `IAuthStore.isAuthenticated`: unauthenticated →
`PUBLIC_SCREENS` only; authenticated → `{...PRIVATE_SCREENS, ...PUBLIC_SCREENS}` (both merged, so public
screens like SignIn remain addressable e.g. during logout transitions). Deep linking config in
`src/app/App.linking.ts` (scheme from `DEEPLINK_BASE_URL` env var, builds a path map from the same
screen manifests).

## State Management (MobX)

Singleton stores registered via IoC (`makeAutoObservable`, usually `{ autoBind: true }`). Reusable
async-state containers ("holders") in `src/shared/lib/holders/`:
- `base/` — `BaseHolder`, `BaseListHolder`, `CombinedHolder` (compose multiple holders' loading/error state)
- `entity/` — `EntityHolder` (+ `EntityProvider`, `use-entity-holder`, `use-entity-context`)
- `collection/` — `CollectionHolder` (+ `CollectionProvider`)
- `paged/` — `PagedHolder` (+ `PagedProvider`)
- `infinite/` — `InfiniteHolder` (+ `InfiniteProvider`)
- `cursor/` — `CursorHolder`, `CachedCursorHolder`, `SyncCursorHolder`
- `mutation/` — `MutationHolder` (+ `MutationProvider`)
- `polling/` — `PollingHolder` (+ `PollingProvider`)
- `filter/` — `FilterHolder`, `FiltersHolder`, `ValueHolder`
- `hooks/` — `use-holder-ref`, `watch-effect`, `context-helpers`

## API Layer

`HttpClient` (`src/shared/api/http-client.ts`, IoC) wraps a single axios instance:
- Request interceptor: awaits `ITokenSource.ensureFreshToken()`, sets `Authorization: Bearer <token>`.
- Response interceptor: normalizes to `{ data } | { error, isCanceled }`; on HTTP 401, deduplicates
  concurrent refresh calls (`_handleConcurrentRefresh`) and retries the original request once
  (`_retry` flag); on network/server errors, shows a notification toast via `INotificationService`.
- `QueryRace` (`query-race.ts`) cancels/dedupes concurrent requests to the same `METHOD url` endpoint
  unless `useQueryRace: false` is passed.
- `axiosInstance` (exported from `http-client.ts`) is the orval mutator (`orval.config.ts` →
  `override.mutator`), so all generated API functions (`src/shared/api/gen/api.ts`) go through this client.
- `src/shared/api/api.ts` exports `api = getRestApi()` — the generated, typed REST client surface.

## Socket.IO

`src/shared/lib/socket/` — `SocketTransport` (`transport/socket.transport.ts`): auto-reconnect,
`EmitQueue` (buffers emits while offline, `transport/emit-queue.ts`), `PersistentListeners` (listeners
that survive reconnects, `transport/persistent-listeners.ts`), token-aware (via
`socket/contract/token-provider.types.ts`). `UserSocketService` (`socket/user/user.socket.ts`) exposes
user-scoped realtime events; shared event name/type contracts in `socket/events/`.

## Theming

`src/shared/lib/theme/` — `ThemeProvider`/`ThemeContext`, variants in `theme/variants/{light,dark}.ts`,
hooks `useTheme` / `useThemeAwareObject` (`theme/hooks/`). Backed by IoC services `ColorSchemeService`
(system color scheme detection) and `ThemeStore` (current theme state, persisted).
