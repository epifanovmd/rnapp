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
`react-native-reanimated`/`react-native-gesture-handler` (chart interactions) + `@legendapp/list` v3
(chat virtualization) + `react-native-keyboard-controller` (keyboard insets). Node >= 22.11. New
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
                  app-state, webrtc, media, transition, slots, models, utils, hooks, keyboard,
                  contracts
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
  React Native port of the pod's `ChatViewController` on **`@legendapp/list`**). `JsChatView.tsx`
  itself is only composition; the layers below it depend strictly downwards
  (`components → hooks → scroll → data → config → utils`):
  - `config/` — 1:1 port of `ChatTheme` / `ChatLayout` / `ChatFeatures`, plus `chat-styles.ts`:
    `createChatStyles(theme, layout)` builds the cell's **ready** styles once per theme+layout pair
    (`byOwnership[ownership]` + `shared`). This is the port of "colors are applied in `configure`" and
    the single biggest list win — a cell no longer allocates dozens of style objects per render.
  - `data/` — all data handling: `chat-message.ts` (model + parse: media priority, `files[]`, link
    detection and emoji-only detection are computed **once, at parse time**), `message-parser.ts`
    (identity-preserving cache), `message-diff.ts`, `update-plan.ts` (port of the
    `MessageUpdateHandler` router: initial/clear/prepend/append/content/structural), `chat-rows.ts`
    (`ChatRow` carries `key`, `resolvedReply`, `showSenderName`, `bubbleless`), `chat-data.ts` (rows,
    indices, date separators, avatar groups).
  - `scroll/` — pure math, no React: `chat-geometry.ts` (`IChatGeometry`, the narrow interface all
    logic depends on instead of the list library), `scroll-anchor.ts`, `visibility-tracker.ts`
    (hysteresis + throttle/debounce), `floating-date.ts`, `avatar-layout.ts` (sticky-avatar math).
  - `services/` — `voice-player.ts` (idle/loading/playing/paused/failed; state is exposed **per track
    as primitives**, so a playing message never re-renders the other voice bubbles) and
    `unread-manager.ts`. Both have simulated backends — no audio native module exists here.
  - `utils/` — `text-format.ts` (dates, durations, file sizes, pluralisation, emoji-only, base
    `TextStyle`) and `link-detector.ts`.
  - **Обновление данных построено на сохранении идентичности**: `ChatMessageParser`
    (`data/message-parser.ts`) кеширует `parseChatMessage` по входному сообщению, а `ChatRowsBuilder`
    (`data/chat-rows.ts`) переиспользует строку, пока не изменились её входы. Список перерисовывает
    ровно те контейнеры, чьи строки реально изменились (`itemsAreEqual` в `ChatList.tsx`, `renderItem`
    стабилен и не замыкается на массив). Требование к хосту: `messages` обязан сохранять идентичность
    неизменённых элементов (демо кеширует `mapMessageToNative` по DTO).
  - `hooks/` — one hook per responsibility: `useChatGeometry` (the **only** file that knows about
    LegendList — adapts `getState()` to `IChatGeometry`), `useChatData`, `useChatMessageUpdates`,
    `useChatScroll`, `useChatScrollAnchor`, `useChatCommands` (the only place that moves the list),
    `useChatPagination`, `useChatVisibility`, `useChatFloatingDate`, `useChatAvatars`,
    `useChatOverlays`, `useChatDisintegration`, `useChatInitialScroll`, `useChatInputBar`,
    `useChatCellDelegate`, `useChatConfig`.
  - `components/` — rendering only: `ChatList.tsx` (the LegendList wrapper), `ChatRowView.tsx` (row
    dispatcher, takes **only the row**), `MessageBubble`, content views for text/links and files, plus
    reply, thread, footer, floating date, empty state. A component that needs sub-components lives in
    its own kebab-case folder with an `index.ts` barrel — one component per file:
    `message-cell/` (+ `HighlightOverlay`), `message-content/` (+ `MessageMedia`), `reactions-row/`
    (+ `ReactionChip`), `chat-fab/` (+ `FabBadgeLabel`), `chat-avatar-layer/` (+ `StickyAvatarView`),
    `disintegration-overlay/` (+ `DisintegrationBurst`, `DisintegrationParticle`,
    `disintegration-particles.ts`), `content/voice-content/` (+ `VoiceWaveform`, `WaveBar`,
    `VoiceTimer`, `waveform-math.ts`), `content/poll-content/` (+ `PollOptionRow`),
    `content/media-grid-content/` (+ `MediaGridCell`, `media-grid-layout.ts`). Per-item context menu is
    `JsContextMenuView` (deep import as a testing exception — the native menu on iOS is shown by the
    demo screen's own native-vs-JS switch).
    Оверлеи подписываются на **отдельные поля** стора через `useOverlayValue`; покадровые величины
    (сдвиг плашки даты, позиции sticky-аватаров, прогресс голосового) живут в shared values и до
    React не доходят.
  - Sticky-аватары — порт `AvatarSupplementaryView` + `avatarAttributes`: аватар группы прилипает к
    низу видимой области, поэтому рисуется слоем поверх списка (`ChatAvatarLayer` +
    `chat-avatar-store.ts`), а ячейка только резервирует под него колонку.

  Native parity comes from `ChatList.tsx`: `AnimatedLegendList` (the `@legendapp/list/reanimated`
  build — it exposes `refScrollView` and `sharedValues.scrollOffset`, which the compensation needs),
  `alignItemsAtEnd`, `maintainVisibleContentPosition: { data, size }` (port of `applyPrepend`'s
  `newTotalH - oldTotalH` compensation and `applyContentOnly`'s size stabilization), and the bottom
  spacer driven by `use-scroll-compensation.ts`. `recycleItems` is deliberately **off**: chat cells
  hold internal state (voice playback, highlight, disintegration hide).
  One props/events contract (`types.ts`, aliased from the codegen spec). The chat demo (`ChatRoom`
  widget) has a temporary native-vs-JS switch for iOS comparison (deep imports as a testing exception).
- **InputBar** (iOS native, `ios/InputBar/Bridge/`, 3 files) — same pattern, also imports `IOSChatView`.
  JS side lives in `src/shared/ui/input-bar/`: entry point `InputBar.tsx` (iOS → `native/NativeInputBar.tsx`,
  elsewhere → `JsInputBar.tsx`). Layered the same way as `chat-view`:
  - `config/` — `input-bar-theme.ts` / `input-bar-layout.ts` (ports of `InputBarTheme` and the input part
    of `ChatLayout`; key names match `IChatViewTheme`/`IChatViewLayout`, so the chat passes its own
    objects straight through), `input-bar-styles.ts` (`createInputBarStyles(theme, layout)` — the same
    precomputed-styles trick as in the chat) and `input-bar-context.ts` (context + features).
  - `model/input-bar-mode.ts` — modes, recording state, delegate and imperative ref.
  - `services/voice-recorder.ts`, `utils/text-format.ts`, `hooks/` (one hook per behaviour).
  - `components/input-bar-view/` — the core `InputBarView` (port of the pod's `InputBarView`: growing text
    field, reply/edit panel, attach button, morphing mic/send button, voice-recording gesture with
    slide-to-cancel/lock) split into `InputBarAttachButton`, `InputBarTextField`, `InputBarSendButton`,
    `InputBarMicButton`. It is shared by both `JsInputBar` and the integrated bar inside `JsChatView`,
    mirroring how both native bridges reuse the pod's `InputBarView`.
  The native view does **not** self-size: under Fabric a legacy-interop view never gets asked for
  `intrinsicContentSize`, so Yoga gives it height 0. It reports its Auto Layout height via
  `onHeightChange` (on every layout **and** on every content change — mode, text growth, recording) and
  the host must apply that height to the view's style; the pod's bar is pinned to the bridge's bottom at
  priority 999 so a stale RN height never squashes its internal layout.
- **Keyboard compensation** is a 1:1 port of `updateCollectionInsets` + `KeyboardFreezeManager`, and it
  lives in its own reusable module **`shared/lib/keyboard/`** — it knows nothing about chat, so any
  screen with a floating bottom bar over scrollable content uses it (chat, `KeyboardScrollView`, the
  ui-kit-demo InputBar page).

  **One hook per screen: `use-keyboard-inset.ts` (`useKeyboardInset`).** It assembles everything and
  hands each concern out as its own value: `barStyle`/`barOffset` (the floating bar, always live),
  `contentInset` + `scroll` (the content, freezable), `freeze()`/`restore()` (the context menu),
  `setBarHeight`. Exactly one instance per screen — a second one is a second keyboard subscription and
  the bar drifts from the content. **Freeze holds only the content inset**, never the bar: that is the
  reference (`updateCollectionInsets` bails on `isInsetFrozen`; the bar's `keyboardLayoutGuide`
  constraint is untouched). The wrappers `KeyboardInputBar` and `KeyboardScrollView` are presentational
  and create nothing.

  Underneath, one hook per responsibility:
  - `use-keyboard-height.ts` — raw keyboard height as a shared value (per-frame, incl. interactive
    swipe-dismiss) + a JS-readable `isVisible()`. The only low-level source of truth.
  - `occludedBottom` (inside `use-keyboard-inset.ts`) = `max(keyboardHeight, safeAreaBottom)` — how much
    of the screen bottom is taken by something that is not content. The bar stands on that edge
    (`translateY(-occludedBottom)`, exposed as `barOffset` for the FAB), and the content inset is
    `occludedBottom + barHeight + extraPadding`. Deliberately not called "shift": in this module *shift*
    means the movement driven by `contentInset` (see `use-scroll-compensation.ts`), and `occludedBottom`
    is only a shift for the bar — for the content it is an occlusion.
  - Freeze is the port of `KeyboardFreezeManager`, but the mechanic is not keyboard-specific and lives
    in `shared/lib/hooks/use-freezable-value.ts` (`useFreezableValue`): it freezes any shared value,
    remembers whether the source was active, asks it back, and thaws only once the live value has
    caught up (with a fallback timer). `useKeyboardInset` only picks *which* value to freeze — the
    content inset, never the bar.
  - `use-scroll-compensation.ts` — **the single source of shift.** One `bottomInset` shared value
    (`occludedBottom + barHeight + own padding`) drives both the bar's `translateY` and the list's zone in the
    same UI-thread frame, mirroring the reference where the inset is derived from `inputBar.frame.minY`
    rather than from the keyboard separately. The zone is a spacer at the end of the content (counts
    toward content size, so `scrollToEnd`/autoscroll stay correct) and the scroll moves by the same
    delta. Do **not** hand this to `KeyboardChatScrollView`: it subscribes to the keyboard itself and
    becomes a second driver — that is exactly what made the list lag visibly behind the input bar.
  - `KeyboardFloatingView.tsx` — port of `keyboardLayoutGuide` + `followsUndockedKeyboard`;
    `KeyboardInputBar` in `input-bar/` is now a thin alias of it.

  Translating the list container instead (an even earlier approach) hides the top of the content behind
  the clip bounds — don't reintroduce it, and don't hardcode bottom paddings. See `project_native.md`.
- **ContextMenu** (iOS only, `ios/ContextMenu/Bridge/`, 3 files) — same bridge pattern, also imports
  `IOSChatView` (the actual menu UI lives in the external pod: `rn-chat-view/Sources/IOSChatView/ContextMenu/`).
  No Android native implementation exists. JS side lives in `src/shared/ui/context-menu-view/`: the public
  entry point `ContextMenuView.tsx` picks the implementation per platform (iOS → the native wrapper
  `native/NativeContextMenuView.tsx`, elsewhere → `JsContextMenuView.tsx`, a full JS re-implementation on
  Reanimated + Gesture Handler, 1:1 port of the pod's layout/theme/animations; submodules `config/`
  (theme + `createContextMenuStyles`), `layout/` (pure placement math), `menu/` (`ContextMenuOverlay`,
  `ContextMenuBackdrop`, `ContextMenuHost`, plus `actions-view/` and `emoji-panel/` folders — one
  component per file), `hooks/`; per-item the component is just a View + long-press gesture — the overlay
  renders once via `<ContextMenuView.Host />` in App.tsx, driven by a singleton
  `context-menu-controller.ts`, so it is safe in large lists). Only `ContextMenuView` is exported
  publicly; the demo screen deep-imports both concrete implementations directly as a testing exception.
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
