---
name: Native Modules (iOS & Android)
description: Кастомные нативные модули — ChatView, InputBar, ContextMenu (iOS-only bridges), Picker/WheelPicker (iOS+Android)
type: project
---

**This file was fully re-verified against `template/ios/` and `template/android/` source (excluding
`ios/build/`, `android/**/build/`, `android/**/.cxx/`, and Pods). Prior versions of this documentation
significantly overstated what lives inside this repo — read the corrections below before trusting any
older notes elsewhere (comments in JS/Swift source included).**

## The big picture: bridge-only modules + one external pod

Three of the four custom native UI components (ChatView, InputBar, ContextMenu) are **thin RN bridges**
living in this repo; their actual view/business logic comes from an **external CocoaPod, `IOSChatView`**,
declared in `ios/Podfile`:

```ruby
pod 'IOSChatView', :path => '../../../rn-chat-view', :modular_headers => true
```

i.e. a sibling repository (`rn-chat-view`, three directories up from `ios/`) that is NOT part of this
repo and was not inspected as part of this documentation pass — treat its internals as unknown/opaque.
All three bridge Swift files (`RNChatView.swift`, `RNInputBar.swift`, `RNContextMenuView.swift`) start
with `import IOSChatView`.

`DifferenceKit` and `Firebase/Core`+`Firebase/Messaging` are also declared in the Podfile
(`modular_headers`); DifferenceKit is presumed to be a transitive dependency used by `IOSChatView` for
diffing (not directly referenced by any Swift file in this repo).

## iOS (`template/ios/`)

### ChatView — iOS only
`ios/ChatView/Bridge/` — 3 files: `RNChatView.swift` (621 lines, the `UIView` subclass — props, event
blocks, wraps an `IOSChatView`-provided chat view controller), `RNChatViewManager.swift` (43 lines,
`RCTViewManager` subclass exposing `scrollToBottom`/`scrollToMessage`/`clearUnread` commands),
`RNChatViewManager.m` (71 lines, Objective-C `RCT_EXTERN_MODULE` export boilerplate for the Swift manager).
**No Android implementation exists** (see below) — `src/widgets/chat-room/native/ChatView.tsx` explicitly
returns `null` when `Platform.OS === "android"`.

### InputBar — iOS only
`ios/InputBar/Bridge/` — 3 files: `RNInputBar.swift` (158 lines), `RNInputBarManager.swift` (34 lines),
`RNInputBarManager.m` (32 lines). Same bridge pattern as ChatView, also imports `IOSChatView`. Not
mentioned in any prior version of this repo's documentation. **No Android implementation** —
`src/widgets/chat-room/native/InputBar.tsx` returns `null` on Android (per its own header comment).

### ContextMenu — native bridge iOS only, plus a JS behavioural port
`ios/ContextMenu/Bridge/` — 3 files: `RNContextMenuView.swift` (156 lines), `RNContextMenuViewManager.swift`
(12 lines), `RNContextMenuViewManager.m` (22 lines). Also imports `IOSChatView` (the actual menu UI —
`ContextMenuViewController`, `ContextMenuLayoutEngine`, `ContextMenuAnimator`, panels, themes — lives in
the external pod, sibling repo `rn-chat-view/Sources/IOSChatView/ContextMenu/`).
No Android native implementation exists (`MainApplication.kt` registers only `RnWheelPickerPackage()`).
JS side lives in `src/shared/ui/context-menu-view/`:
- `native/` — `NativeContextMenuView.tsx` (wrapper over the native `RNContextMenuView`; renders plain
  children on non-iOS platforms) + `NativeContextMenuViewSpec.ts` (codegen spec);
- `ContextMenuView.tsx` (root; the single public entry point — resolves the implementation per
  platform: iOS → NativeContextMenuView, elsewhere → JsContextMenuView) + `JsContextMenuView.tsx`
  (thin per-item — View + long-press gesture only) +
  `context-menu-controller.ts` (singleton presenter, mirrors the one-presented-VC native model) + `menu/`
  (`ContextMenuHost` — single overlay render point, mounted once in App.tsx as `<ContextMenuView.Host />`;
  `ContextMenuOverlay`, `ContextMenuBackdrop`, `ContextMenuEmojiPanel`, `ContextMenuActionsView`,
  `SfSymbolIcon`) + `hooks/useContextMenuAnimator.ts` + `utils/` (`context-menu-layout.ts`,
  `context-menu-theme.ts`) — a full cross-platform JS re-implementation (Reanimated + Gesture Handler)
  that ports the native pod's layout engine, themes and spring animations 1:1. Both components share the
  exact same props/events contract (`types.ts`, derived from the codegen spec types).
The demo screen `pages/ui-kit-demo/stack/context-menu/ContextMenu.tsx` (`ContextMenu` stack route) has a
temporary switch to compare native vs JS implementations side by side on iOS — it deep-imports both
concrete implementations directly (a testing-only exception; regular code must use `ContextMenuView`).

### Picker / WheelPicker — the only module implemented on both platforms
`ios/Picker/` — 6 Objective-C files, old-style (non-Fabric) `RCTViewManager`: `Picker.h`/`Picker.m`
(219 lines), `PickerLabel.h`/`PickerLabel.m`, `RnWheelPicker.h`/`RnWheelPicker.m`. No Swift here — this
predates the Swift bridges above.

### AppDelegate.swift (`ios/rnapp/AppDelegate.swift`)
- Swift, `@main class AppDelegate: UIResponder, UIApplicationDelegate`.
- Uses `RCTReactNativeFactory` + `RCTAppDependencyProvider` (new-architecture bootstrap style, not the
  old `RCTBridge`/`RCTRootView` pattern).
- `RNBootSplash.initWithStoryboard("BootSplash", ...)` in `ReactNativeDelegate.customize`.
- Deep links: `RCTLinkingManager` wired into both `application(_:open:options:)` (custom scheme) and
  `application(_:continue:restorationHandler:)` (universal links).

### Podfile (`ios/Podfile`)
- `use_frameworks! :linkage => :static`.
- `setup_permissions([...])` from `react-native-permissions` — only `'Notifications'` is uncommented.
- Pods: `react-native-config`, `Firebase/Core`, `Firebase/Messaging`, `DifferenceKit`, `IOSChatView`
  (external, see above).

### Build schemes
`ios/rnapp.xcodeproj/xcshareddata/xcschemes/`: `rnapp.developmentDebug`, `rnapp.developmentRelease`,
`rnapp.stagingDebug`, `rnapp.stagingRelease`, `rnapp.productionDebug`, `rnapp.productionRelease` — matches
the `ios:*` npm scripts 1:1 (note: `ios:Stg-Release` in `package.json` has a typo,
`'rnapp.stagingReleasse'`, extra `s` — this looks like a real bug, not intentional).

---

## Android (`template/android/`)

### MainApplication.kt (`android/app/src/main/java/com/rnapp/MainApplication.kt`)
- Kotlin. New-architecture bootstrap (`ReactHost`/`getDefaultReactHost`/`loadReactNative`), not the old
  `ReactNativeHost` pattern.
- Registers **exactly one** custom native package: `RnWheelPickerPackage()`, added to `PackageList(this).packages`.
- No `RNChatViewPackage`, `RNInputBarPackage`, or `RNContextMenuViewPackage` exist or are registered.

### MainActivity.kt
- `ReactActivity`, `getMainComponentName() = "rnapp"`, `DefaultReactActivityDelegate(..., fabricEnabled)`.
- `RNBootSplash.init(this, R.style.BootTheme)` in `onCreate`.

### AndroidManifest.xml
- Permissions: `INTERNET`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`, `CAMERA`, `WRITE_EXTERNAL_STORAGE`.
- Deep linking: `<data android:scheme="@string/DEEPLINK_BASE_URL" android:host="*" />` on `MainActivity`'s
  `VIEW` intent-filter.
- `usesCleartextTraffic="${usesCleartextTraffic}"` — templated per build variant.

### Native Modules

**rnwheelpicker** (`android/app/src/main/java/com/rnapp/rnwheelpicker/`) — 6 Java files, the only custom
native module actually implemented on Android:
- `Picker.java`, `RnWheelPickerModule.java`, `RnWheelPickerPackage.java`
- `events/ItemSelectedEvent.java`
- `wheelpicker/IWheelPicker.java`, `wheelpicker/WheelPicker.java`

No `rnchatview`, `rninputbar`, or `rncontextmenu` Java/Kotlin packages exist under `android/`. (Android's
`.cxx`/build directories do contain generated C++ codegen scaffolding for `RNChatViewSpec` — from the
Fabric codegen step reading the JS spec file — but this is unused dead codegen output, not a real
implementation; there is no corresponding Kotlin `ViewManager`/`Package` to register it.)

### Build variants
- `flavorDimensions "main"` with `development`/`staging`/`production` product flavors, crossed with
  `debug`/`release` build types (6 total, matching `android:*` npm scripts).
- `envConfigFiles` in `android/app/build.gradle` map each variant to `config/env/{development,staging,production}.android.env`.
- Version code: `Integer.valueOf(System.env.CI_BUILD_NUMBER ?: 1) * 1000`.
- `enableSeparateBuildPerCPUArchitecture = false`, Hermes enabled, `namespace "com.rnapp"`.
- `applicationId`/`app_name` resolved from `.env` (`APP_ID_ANDROID`, `DISPLAY_NAME`), falling back to
  placeholder strings if unset.

---

## JS Specs (Fabric codegen)

- `src/shared/ui/chat-view/native/NativeChatViewSpec.ts` — codegen spec for ChatView (iOS only at runtime).
- `src/shared/ui/input-bar/native/NativeInputBarSpec.ts` — codegen spec for InputBar (iOS only at runtime).
- `src/shared/ui/context-menu-view/native/NativeContextMenuViewSpec.ts` — codegen spec for ContextMenu,
  used by `NativeContextMenuView.tsx` in the same folder (iOS only at runtime).

All three use `codegenNativeComponent`/`codegenNativeCommands` from `react-native`. Filenames are fixed
by RN codegen convention (TurboModule/Fabric) — do not rename. `package.json`'s `codegenConfig` declares
a single umbrella spec name `"RNChatViewSpec"` with `jsSrcsDir: "src"` (scans the whole `src/` tree, so
spec files can live inside any slice without breaking codegen — that's why `NativeContextMenuViewSpec.ts`
lives under `shared/ui/context-menu-view/native/`).

The `.tsx` JS wrappers (`NativeChatView.tsx` in `src/shared/ui/chat-view/native/`, `NativeInputBar.tsx`
in `src/shared/ui/input-bar/native/`, `NativeContextMenuView.tsx` in
`src/shared/ui/context-menu-view/native/`) all try `require(...).default` (the codegen'd Fabric
component) first and fall back to `requireNativeComponent` — this is a defensive fallback, not evidence
of a legacy (non-Fabric) implementation existing anywhere.

On non-iOS platforms all three components resolve to full React Native ports via single public entry
points: `ChatView` (`src/shared/ui/chat-view/ChatView.tsx` → `JsChatView.tsx` on `@shopify/flash-list`),
`InputBar` (`src/shared/ui/input-bar/InputBar.tsx` → `JsInputBar.tsx`, core `ChatInputBar.tsx` shared
with `JsChatView`), `ContextMenuView` (see `project_components.md`). Audio capture/playback in the JS
ports is abstracted (`chat-voice-player.ts` / `chat-voice-recorder.ts` in `chat-view/model/`) with
simulated default backends — real backends can be injected via `setChatVoicePlayerBackend` /
`setChatVoiceRecorderBackend` (no audio native module exists in this project).

## Not verified / needs a human

- Contents of the external `IOSChatView` pod (sibling repo `rn-chat-view`) — out of scope for this repo's
  documentation; assume it can change independently of this repo.
- (resolved) ContextMenu has no Android native implementation; the stale in-repo comment claiming one
  was removed together with the old demo wrapper. Android is covered by the JS implementation
  (`shared/ui/context-menu-view/ContextMenuView.tsx`).
- The `ios:Stg-Release` npm script typo (`'rnapp.stagingReleasse'`) — confirm whether this is a known bug
  or intentional before "fixing" it.
