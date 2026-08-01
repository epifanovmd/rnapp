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
(MAIN tab navigator + Components/Carousel/Chat/Charts/ContextMenu/PdfView/WebView demo stack screens);
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

- **ChatView** (iOS native, `ios/ChatView/Bridge/`, 3 files: `RNChatView.swift`, `RNChatViewManager.swift`,
  `RNChatViewManager.m`) — a thin RCTViewManager bridge. The real chat UI implementation (cells, layout,
  diffing, etc.) lives in an **external CocoaPod** `IOSChatView`, pulled from a sibling repo via
  `Podfile`: `pod 'IOSChatView', :path => '../../../rn-chat-view'` — i.e. it is NOT part of this repo.
  JS side lives in `src/shared/ui/chat-view/`: the public entry point `ChatView.tsx` picks the
  implementation per platform (iOS → `native/NativeChatView.tsx`, elsewhere → `JsChatView.tsx` — a full
  React Native port of the pod's `ChatViewController` on `@shopify/flash-list`: `model/` pure logic
  (theme/layout/features 1:1, row building, message diff with localId pending→real keys, date helper,
  unread manager, voice player/recorder abstractions with simulated backends), `components/` (bubble,
  content views for text/links, media grid, voice, poll, files, reactions, reply, thread, footer, FAB,
  floating date, empty state, disintegration burst), pagination/visibility (throttle+debounce)/scroll
  anchor/commands in `JsChatView.tsx`; per-item context menu reuses `shared/ui/context-menu-view`).
  One props/events contract (`types.ts`, aliased from the codegen spec). The chat demo (`ChatRoom`
  widget) has a temporary native-vs-JS switch for iOS comparison (deep imports as a testing exception).
- **InputBar** (iOS native, `ios/InputBar/Bridge/`, 3 files) — same pattern, also imports `IOSChatView`.
  JS side lives in `src/shared/ui/input-bar/`: entry point `InputBar.tsx` (iOS → `native/NativeInputBar.tsx`,
  elsewhere → `JsInputBar.tsx`). The core `ChatInputBar.tsx` (port of the pod's `InputBarView`: growing
  text field, reply/edit panel, attach button, morphing mic/send button, voice-recording gesture with
  slide-to-cancel/lock) lives in the same folder and is shared by both `JsInputBar` and the integrated
  input bar inside `JsChatView` (mirroring how both native bridges reuse the pod's `InputBarView`).
  The native view does **not** self-size: under Fabric a legacy-interop view never gets asked for
  `intrinsicContentSize`, so Yoga gives it height 0. It reports its Auto Layout height via
  `onHeightChange` (on every layout **and** on every content change — mode, text growth, recording) and
  the host must apply that height to the view's style; the pod's bar is pinned to the bridge's bottom at
  priority 999 so a stale RN height never squashes its internal layout.
- **Keyboard compensation** (both JS ports) is a 1:1 port of `updateCollectionInsets`, implemented in
  two hooks in `shared/lib/hooks/`:
  - `useKeyboardOverlay()` → `overlay` = `max(keyboardHeight, safeAreaBottom)`, плюс raw `keyboardHeight`
    для продвинутых сценариев (freeze/thaw панели). Единственный источник правды, принимает
    опциональный замороженный оверлей для контекстного меню.
  - `useKeyboardScrollCompensation(bottomOverlay)` — принимает суммарное перекрытие снизу (оверлей +
    высота панели ввода), компенсирует распоркой в конце контента + эквивалентным `scrollTo` на
    UI-потоке. Состояние — «сколько уже применили», поэтому самовосстанавливается после любых
    пропущенных событий. Заморозка без флага: владелец оверлея просто перестаёт его обновлять.
  Translating the list container instead (an earlier approach) hides the top of the content behind the
  clip bounds — don't reintroduce it, and don't hardcode bottom paddings. The input bar overlay rides
  the keyboard via `KeyboardInputBar` (port of `keyboardLayoutGuide`). See `project_native.md`.
- **ContextMenu** (iOS only, `ios/ContextMenu/Bridge/`, 3 files) — same bridge pattern, also imports
  `IOSChatView` (the actual menu UI lives in the external pod: `rn-chat-view/Sources/IOSChatView/ContextMenu/`).
  No Android native implementation exists. JS side lives in `src/shared/ui/context-menu-view/`: the public
  entry point `ContextMenuView.tsx` picks the implementation per platform (iOS → the native wrapper
  `native/NativeContextMenuView.tsx`, elsewhere → `JsContextMenuView.tsx`, a full JS re-implementation on
  Reanimated + Gesture Handler, 1:1 port of the pod's layout/theme/animations; submodules `menu/`,
  `hooks/`, `utils/`; per-item the component is just a View + long-press gesture — the overlay renders
  once via `<ContextMenuView.Host />` in App.tsx, driven by a singleton `context-menu-controller.ts`, so
  it is safe in large lists). Only `ContextMenuView` is exported publicly; the demo screen deep-imports
  both concrete implementations directly as a testing exception.
  Both share one props/events contract (`types.ts`). Demo: `ContextMenu` stack screen
  (`pages/ui-kit-demo/stack/context-menu/`) with a temporary native-vs-JS switch for iOS comparison.
- **Picker / WheelPicker** — exists on **both** platforms (not Android-only as previously documented):
  iOS as plain Objective-C (`ios/Picker/`: `Picker.h/.m`, `PickerLabel.h/.m`, `RnWheelPicker.h/.m`, 6
  files, old-style RCTViewManager, no Swift); Android as Java (`android/app/src/main/java/com/rnapp/rnwheelpicker/`,
  6 files: `Picker.java`, `RnWheelPickerModule.java`, `RnWheelPickerPackage.java`,
  `events/ItemSelectedEvent.java`, `wheelpicker/{IWheelPicker,WheelPicker}.java`). This is the only custom
  native package registered in `MainApplication.kt` (`RnWheelPickerPackage()`).

JS-side codegen specs (Fabric): `src/shared/ui/chat-view/native/NativeChatViewSpec.ts`,
`src/shared/ui/input-bar/native/NativeInputBarSpec.ts`,
`src/shared/ui/context-menu-view/native/NativeContextMenuViewSpec.ts`. On Android there is no native
chat implementation — the JS ports (`JsChatView`/`JsInputBar`/`JsContextMenuView`) are used instead.
See `project_native.md` for full detail and what's unverified.

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
