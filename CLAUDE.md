# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A React Native template app (messenger-style demo): auth (sign-in/sign-up/recovery, 2FA, biometrics,
passkeys), a native chat room screen (mocked data, no real backend wiring for chat), settings, and a
"ui-kit-demo" playground showcasing the component library and native modules. The actual source lives
under `template/` (this repo is a template scaffold — root `package.json`/`template.config.js` are for
the scaffolding tool, not the app itself).

## Detailed Documentation

Подробная документация в `.claude/memory/` — при необходимости глубокого анализа читай эти файлы:
- `.claude/memory/project_architecture.md` — структура, стек, IoC, навигация, state, API layer, socket, тема
- `.claude/memory/project_native.md` — iOS/Android нативные модули (ChatView, InputBar, Picker/WheelPicker)
- `.claude/memory/project_components.md` — UI-компоненты, compound components, slots
- `.claude/memory/project_screens.md` — экраны, навигация
- `.claude/memory/project_patterns.md` — паттерны создания stores, компонентов, форм
- `.claude/memory/project_build.md` — команды, multi-env, native build notes
- `.claude/memory/project_aliases.md` — path aliases
- `.claude/memory/project_charts.md` — Skia+Reanimated charting core (`shared/ui/chart`): слои, фичи,
  как добавлять новые графики/фичи

## Stack

React Native 0.86 + React 19.2 + TypeScript 5.9 + MobX 6 + React Navigation 7 + Socket.IO client 4 +
Axios + Zod 4 + react-hook-form 7 + Inversify 8 (IoC) + `@shopify/react-native-skia` (charting) +
`react-native-reanimated`/`react-native-gesture-handler` (chart interactions). Node >= 22.11. New
Architecture (Fabric/TurboModules) is enabled (`fabricEnabled` on Android, codegen specs for custom
native views).

## Commands

All commands run from `template/`.

```bash
# iOS
npm run ios:Dev-Debug          # Development debug
npm run ios:Stg-Debug          # Staging debug
npm run ios:Prod-Release       # Production release
# (also: Dev-Release, Stg-Release, Prod-Debug)

# Android
npm run android:Dev-Debug
npm run android:Stg-Debug
npm run android:Prod-Release
# (also: Dev-Release, Stg-Release, Prod-Debug)
npm run android:build          # assembleProductionRelease

# Code Quality
npm run lint                   # ESLint
npm run lint:fix               # ESLint auto-fix
npm run prettier:fix           # Prettier format

# API Generation
npm run generate:orval         # Regenerate API client/types from OpenAPI (orval.config.ts)

# Misc
npm run start                  # Metro, --reset-cache
npm run reinstall              # watchman + node_modules wipe + yarn + pod install
```

There is no `plop`/scaffolding-generator script in this project — new slices/files are created by hand
following the patterns in `project_patterns.md`.

## Architecture

Feature-Sliced Design: `app → pages → widgets → features → entities → shared` (each layer may only import
from layers strictly below it; `app` sees everything).

```
template/src/
  app/        ← composition root: App.tsx, App.navigator.tsx, App.screens.ts, app-tab-screens.tsx,
                App.linking.ts, App.notifications.tsx, app.module.ts (DI registration), app-data-*
  pages/      ← screens — thin composition of widgets/features/entities per route
                (sign-in, sign-up, recovery-password, chat, settings, ui-kit-demo)
  widgets/    ← large self-contained UI blocks (chat-room, app-shell)
  features/   ← use-cases (sign-in, sign-up, recovery-password, biometric)
  entities/   ← business entities — state/models, no UI forms (auth, user)
  shared/     ← reusable code with no business-logic awareness
    ui/       ←   UI kit (shared/ui/*)
    api/      ←   HttpClient (axios) + orval-generated client in api/gen/ (never edit by hand)
    config/   ←   env.ts (react-native-config wrapper)
    lib/      ←   di, holders, navigation, theme, socket, storage, notifications, network,
                  app-state, webrtc, media, transition, slots, models, utils, hooks, contracts
```

Slices within the same layer never import each other directly (`entities/auth` cannot see
`entities/user`, `features/sign-in` cannot see `features/sign-up`, etc. — enforced by
`eslint-plugin-boundaries`, config in `eslint.boundaries.mjs`). If two slices in the same layer need to
share logic, that logic moves down a layer (e.g. shared login/password Zod schemas live in
`entities/auth`, used by both `features/sign-in` and `features/sign-up`). File/folder naming is enforced
by `eslint-plugin-check-file` (`eslint.naming.mjs`).

### Path aliases

`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared` — declared in **both**
`tsconfig.json` (`compilerOptions.paths`, used by tsc/IDE) and `babel.config.js`
(`babel-plugin-module-resolver`, used by Metro at bundle time). These two must be kept in sync manually
whenever an alias changes — there's no single source of truth generating both.

### IoC (Dependency Injection)

Custom lightweight DI on top of Inversify, in `src/shared/lib/di/` (`createInjectDecorator`,
`iocContainer`). Each slice that needs DI exposes an `<slice>.module.ts` with a `ContainerModule`, and all
modules are loaded once in `src/app/app.module.ts` (`registerContainerModules`). Real example
(`src/entities/auth/model/types.ts` + `store.ts` + `src/entities/auth/auth.module.ts`):

```ts
// model/types.ts
export const IAuthStore = createInjectDecorator<IAuthStore>();
export interface IAuthStore {
  readonly isAuthenticated: boolean;
  signIn(params: ISignInRequestDto): Promise<void>;
  // ...
}

// model/store.ts
@injectable()
class AuthStore implements IAuthStore {
  constructor(
    @IApiService() private _api: IApiService,
    @IAuthSessionService() private _session: IAuthSessionService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }
  // ...
}
export { AuthStore };

// auth.module.ts
export const authModule = new ContainerModule(({ bind }) => {
  bind(IAuthStore.Tid).to(AuthStore).inSingletonScope();
  // ...
});

// consumed anywhere (component or another service):
const authStore = IAuthStore.useInstance(); // hook-style, memoized via useRef
// or, outside React: IAuthStore.getInstance()
```

### Navigation (React Navigation 7)

`src/shared/lib/navigation/` wraps Stack + Bottom Tabs + Material Top Tabs (`StackNavigation.tsx`,
`TabNavigation.tsx`, `TopTabNavigation.tsx`, `AppNavigation.tsx`) plus a `NavigationService` IoC singleton
(route history, `navigateTo`/`pushTo`/`replaceTo`/`goBack`). Screens are registered as plain manifests:
`src/app/App.screens.ts` exports `PUBLIC_SCREENS` (SignIn/SignUp/RecoveryPassword) and `PRIVATE_SCREENS`
(MAIN tab navigator + Components/Carousel/Chat/Charts/PdfView/WebView demo stack screens);
`src/app/app-tab-screens.tsx` exports `TAB_SCREENS` (Main/Playground/Settings) rendered inside the `MAIN`
route. The chat demo (`ChatRoom`, `src/pages/chat`) and the chart demo (`Charts`, `src/pages/ui-kit-demo`)
are both stack screens reached via buttons on the Playground tab, not tabs themselves. `App.navigator.tsx`
picks `PUBLIC_SCREENS` when unauthenticated, or `{...PRIVATE_SCREENS, ...PUBLIC_SCREENS}` when
authenticated. Deep linking config lives in `src/app/App.linking.ts`.

### State management (MobX)

Singleton stores registered via IoC, `makeAutoObservable`. Reusable async-state containers ("holders")
live in `src/shared/lib/holders/`: `EntityHolder`, `PagedHolder`, `InfiniteHolder`, `CollectionHolder`,
`MutationHolder`, `PollingHolder`, `CombinedHolder`, plus `CursorHolder`/`CachedCursorHolder`/
`SyncCursorHolder` and `FilterHolder`/`FiltersHolder`/`ValueHolder`. Each has a matching
`use-<x>-holder`/`use-<x>-context` hook and (for some) a React `*Provider` component.

### API layer

`src/shared/api/` — `HttpClient` (axios instance) with interceptors: attaches bearer token
(`ITokenSource.ensureFreshToken`), on 401 triggers a deduplicated token refresh + single retry, shows a
notification toast on network/server errors. `QueryRace` dedupes/cancels in-flight requests to the same
endpoint. `src/shared/api/gen/` is generated by orval from a remote OpenAPI spec (`orval.config.ts`,
`npm run generate:orval`) — **never edit `gen/` by hand**.

### Socket.IO

`src/shared/lib/socket/` — `SocketTransport` (auto-reconnect, token-aware), `EmitQueue` (buffers emits
while offline), `PersistentListeners` (survive reconnects), plus a `UserSocketService` for user-scoped
events (`socket/user/`, `socket/events/`).

### Theming

`src/shared/lib/theme/` — `ThemeProvider`/`ThemeContext`, `light.ts`/`dark.ts` variants, `useTheme` /
`useThemeAwareObject` hooks, backed by a `ColorSchemeService` + `ThemeStore` (both IoC).

## Native modules — verified against actual source

**Important:** older documentation in this repo claimed a large ChatView/ContextMenu implementation
living entirely inside this repo, and WheelPicker as Android-only. Neither is accurate. Verified state:

- **ChatView** (iOS only, `ios/ChatView/Bridge/`, 3 files: `RNChatView.swift`, `RNChatViewManager.swift`,
  `RNChatViewManager.m`) — a thin RCTViewManager bridge. The real chat UI implementation (cells, layout,
  diffing, etc.) lives in an **external CocoaPod** `IOSChatView`, pulled from a sibling repo via
  `Podfile`: `pod 'IOSChatView', :path => '../../../rn-chat-view'` — i.e. it is NOT part of this repo.
- **InputBar** (iOS only, `ios/InputBar/Bridge/`, 3 files) — same pattern, also imports `IOSChatView`.
  Not previously documented anywhere in this repo's memory files.
- **ContextMenu** (iOS only, `ios/ContextMenu/Bridge/`, 3 files) — same bridge pattern, also imports
  `IOSChatView`. A code comment in `src/pages/ui-kit-demo/tabs/main/ContextMenuView.tsx` claims an Android
  native implementation "реализован и работает" — **this is stale/inaccurate**: no Kotlin/Java source for
  it exists anywhere under `android/`, and `MainApplication.kt` registers only one custom package. Treat
  ContextMenu as iOS-only until a human confirms otherwise.
- **Picker / WheelPicker** — exists on **both** platforms (not Android-only as previously documented):
  iOS as plain Objective-C (`ios/Picker/`: `Picker.h/.m`, `PickerLabel.h/.m`, `RnWheelPicker.h/.m`, 6
  files, old-style RCTViewManager, no Swift); Android as Java (`android/app/src/main/java/com/rnapp/rnwheelpicker/`,
  6 files: `Picker.java`, `RnWheelPickerModule.java`, `RnWheelPickerPackage.java`,
  `events/ItemSelectedEvent.java`, `wheelpicker/{IWheelPicker,WheelPicker}.java`). This is the only custom
  native package registered in `MainApplication.kt` (`RnWheelPickerPackage()`).

JS-side codegen specs (Fabric): `src/widgets/chat-room/native/NativeChatViewSpec.ts`,
`src/widgets/chat-room/native/NativeInputBarSpec.ts`,
`src/pages/ui-kit-demo/tabs/main/NativeContextMenuViewSpec.ts`. On Android, `ChatView.tsx`/`InputBar.tsx`
JS wrappers explicitly return `null` (`Platform.OS === "android"` short-circuit) since no Android
implementation is registered. See `project_native.md` for full detail and what's unverified.

## Naming & boundary conventions

- **`eslint-plugin-boundaries`** (`eslint.boundaries.mjs`) enforces the 6-layer FSD stack
  (`shared → entities → features → widgets → pages → app`) plus "no same-layer slice imports"
  (e.g. `entities/auth` may not import `entities/user`).
- **`eslint-plugin-check-file`** (`eslint.naming.mjs`) enforces:
  - Folders: kebab-case under `src/**` (with `_app`/`_auth` as documented, currently-unused, ignored words).
  - `.tsx` files in slices/`shared/ui`: PascalCase for components; camelCase for `use*`/`create*`/`build*`
    prefixed files (hooks/factories that return JSX).
  - `.ts` files in slices: kebab-case, except `use*`/`create*`/`build*` prefixed (camelCase).
  - `shared/{api,config,lib}`: `.ts` kebab-case, `.tsx` PascalCase, **no** verb-prefix camelCase exception
    (hooks here are already kebab-case, e.g. `use-holder-ref.ts`).
  - Explicit exceptions: RN codegen spec files (`NativeChatViewSpec`, `NativeInputBarSpec`,
    `NativeContextMenuViewSpec` — framework-mandated names, not our convention) and the `app/App.*` dotted
    composition-root files (`App.tsx`, `App.screens.ts`, `App.linking.ts`, ...) plus
    `app/app-tab-screens.tsx` (JSX module, not a component, so not PascalCase).

## Mandatory: keep docs in sync

When you make structural or architectural changes to this codebase, you MUST update both this
CLAUDE.md and the relevant files under `.claude/memory/` in the same change — do not leave
documentation stale for the next session.
