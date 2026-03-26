---
name: Project Architecture
description: React Native template app — структура, стек, IoC, навигация, API, сокеты, тема, нативные модули
type: project
---

## Project Structure

```
template/src/
├── api/                    # REST API client (axios)
│   ├── Api.service.ts      # Axios instance, interceptors, refresh, QueryRace
│   ├── Api.types.ts        # IApiService, ApiServiceResponse
│   ├── Api.utils.ts
│   ├── QueryRace.ts        # Cancels duplicate in-flight requests
│   ├── api-gen/            # Auto-generated from OpenAPI (DO NOT EDIT)
│   │   ├── Api.ts          # Generated API methods (extends HttpClient)
│   │   ├── data-contracts.ts
│   │   └── http-client.ts
│   └── hooks/useApi.ts
├── app/                    # App entry point
│   ├── App.tsx             # Root: providers (Theme, SafeArea, BottomSheet, Keyboard, etc.)
│   ├── App.navigator.tsx   # NavigationContainer + auth state → public/private screens
│   ├── App.screens.ts      # PUBLIC_SCREENS (SignIn, SignUp) vs PRIVATE_SCREENS (tabs, etc.)
│   ├── App.linking.ts      # Deep linking config
│   ├── App.notifications.tsx
│   ├── ChatView/           # JS wrapper for native ChatView
│   ├── common/             # Stack transition utils
│   └── hooks/
├── components/             # Reusable UI components
│   ├── actions/            # NavLink, SwitchTheme
│   ├── animatedRefreshing/ # Pull-to-refresh
│   ├── carousel/           # Carousel
│   ├── chat/               # Chat UI (Bubble, Message, InputToolbar, Reply, etc.)
│   ├── collapsable/
│   ├── flexView/           # CSS-like flex props converter
│   ├── holldItemMenu/      # Long-press context menu (JS side)
│   ├── imageViewing/       # Image gallery (platform-specific: iOS/Android)
│   ├── layouts/            # Container, Content, RefreshingContainer, StatusBar
│   ├── navbar/             # Navbar (compound: Title, BackBtn, IconLeft/Right)
│   ├── slots/              # Slot system: createSlot, useSlotProps
│   ├── tabBar/             # Custom tab bar
│   ├── ticket/
│   └── ui/                 # Core UI primitives
│       ├── bottomSheet/    # @gorhom/bottom-sheet wrapper
│       ├── button/         # Button variants
│       ├── checkBox/, chip/, dialog/, field/
│       ├── icon/           # Icon + custom icons
│       ├── image/, input/ (Input, TextField)
│       ├── picker/         # Date, Range, Time, Year pickers
│       ├── scrollView/, switch/, tabs/, text/, title/, touchable/
├── core/                   # Core infrastructure
│   ├── auth/               # AuthSessionService, AuthTokenStore, validations.ts
│   ├── notification/       # NotificationProvider, notificationService
│   ├── permissions/        # Permission management
│   ├── theme/              # ThemeProvider, ThemeContext, useTheme
│   │   └── variants/       # light.ts, dark.ts
│   └── transition/         # TransitionProvider, useTransitionContext
├── di/                     # Dependency Injection (inversify)
│   ├── container.ts, createServiceDecorator.ts, disposer.ts, iocHook.ts, types.ts
├── hooks/                  # Custom React hooks
│   ├── useBiometric.ts, useBoolean.ts, useDimensions.ts
│   ├── useIsVisibleKeyboard.ts, useMergeCallback.ts, mergeRefs.ts
├── navigation/             # React Navigation 7
│   ├── NavigationService.ts # Singleton with history tracking
│   ├── AppNavigation.tsx, StackNavigation.tsx, TabNavigation.tsx, TopTabNavigation.tsx
│   ├── navigation.types.ts # Screen names & param lists
│   └── hooks/
├── screens/
│   ├── stack/
│   │   ├── Authorization/  # SignIn, SignUp, RecoveryPassword
│   │   ├── Carousel/, Components/, PdfView/, WebView/
│   └── tabs/
│       ├── main/, playground/, settings/
├── socket/                 # Socket.IO
│   ├── transport/          # SocketTransport, EmitQueue, PersistentListeners
│   ├── events/             # Typed events
│   └── hooks/              # useSocketStatus
├── store/                  # MobX stores
│   ├── holders/            # EntityHolder, PagedHolder, InfiniteHolder, etc.
│   │   └── filter/         # FilterHolder system
│   ├── models/             # DataModelBase, EnumModelBase
│   ├── app/                # AppDataStore
│   ├── auth/               # AuthStore
│   ├── pushNotification/
│   └── ValueHolder.ts
├── utils/                  # Utility functions
│   ├── formatter/          # Date, bytes, speed formatting
│   ├── platform.ts         # isAndroid, isIos, isWeb, isIPhoneX, dimensions
│   ├── regex.ts, string.ts, typeGuards.ts, pluralize.ts
│   ├── lambdaValue.ts, noop.ts, timeoutManager.ts, etc.
├── assets/
└── types/
```

## Stack

React Native 0.84 + React 19 + TypeScript + MobX + React Navigation 7 + Socket.IO + Axios + Zod + react-hook-form + Inversify (IoC)

## Path Aliases

`@core`, `@api`, `@utils`, `@hooks`, `@di`, `@components`, `@store`, `@navigation`, `@socket` (tsconfig.json + babel.config.js)

## Key Rules

- `src/api/api-gen/` — auto-generated from OpenAPI, NEVER edit manually (`npm run generate:api`)
- **Never import from @force-dev** — all infrastructure is local
- Path aliases без `~` префикса

## IoC (src/di/)

Inversify-based DI:
```ts
export const IMyService = createServiceDecorator<IMyService>();
@IMyService({ inSingleton: true })
class MyService { constructor(@IOther() private other: IOther) {} }
const useMyService = iocHook(IMyService);
```

## Navigation (React Navigation 7)

Stack + Bottom Tabs + Material Top Tabs. Two-level: PUBLIC_SCREENS (auth) vs PRIVATE_SCREENS (app).
NavigationService — singleton с историей и programmatic navigation.
Deep linking через App.linking.ts.

## State Management (MobX)

Singleton stores через IoC. Data holders из `src/store/holders/`:
`EntityHolder`, `PagedHolder`, `InfiniteHolder`, `CollectionHolder`, `MutationHolder`, `PollingHolder`, `CombinedHolder`, `FilterHolder`.

## API Layer

`ApiService` (axios) с interceptors: auth header, 401 → refresh + retry, global error toast.
`QueryRace` — дедупликация одинаковых запросов.

## Socket.IO

`SocketTransport` — auto-reconnect, EmitQueue (offline buffer), PersistentListeners (survive reconnect), token auto-update.

## Theming

ThemeProvider + ThemeContext. Variants: light.ts, dark.ts. Hooks: useTheme, useThemeAwareObject.
