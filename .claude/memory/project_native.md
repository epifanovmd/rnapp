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

**Sizing:** the bridge view does not self-size. Under Fabric a legacy-interop view is never asked for
`intrinsicContentSize` (the old override was removed — it did nothing here), so Yoga gives it height 0
and the host must apply the height the view reports through `onHeightChange`. `RNInputBar.swift`
recomputes that height with `systemLayoutSizeFitting` in `layoutSubviews` **and** re-reports it after
every content change that doesn't touch the RN frame — `applyInputAction` (reply/edit/normal),
`clearInput`, and the delegate callbacks for text change, send, cancel and recording state — via
`scheduleHeightReport()` (one main-queue hop; the pod sets its constraint constants synchronously and
only animates applying them, so no `layoutIfNeeded` is needed — and calling it would cut the pod's
animation short).

The report is deliberately **asymmetric**: growth is sent immediately (an undersized frame clips the bar
out of hit-testing), shrinking is deferred by `shrinkReportDelay` (0.3 s > the pod's own 0.25/0.2 s
panel animations). An RN commit changes the frame without animation, so shrinking the frame mid-animation
re-lays the pod out into its final geometry with a visible jerk; an oversized frame, by contrast, is
invisible because the bar hugs its bottom edge. Any new growth cancels a pending shrink, and the deferred
report re-measures before firing.

The pod's `InputBarView` is anchored **bottom-required / top-`.defaultLow`**
inside the bridge view, which is what makes the unavoidable one-frame lag of the RN frame invisible: the
bar keeps its own natural height (the loose top pin is weaker than the pod's internal `.defaultHigh`
constraints) and expands *upward* from the bottom edge, exactly like the frame itself (anchored to the
keyboard). Pinned to the top instead, it visibly dropped below the keyboard for a frame and snapped back
once JS applied the new height; pinned bottom-required with a required top pin, Auto Layout squashed the
pod's layout (reply panel overlapping the text field). Host side: the ui-kit demo
(`pages/ui-kit-demo/stack/input-bar/InputBar.tsx`) applies `height` only for the native bar — the JS bar
measures itself — starting from `INPUT_BAR_DEFAULT_LAYOUT.inputBarMinHeight` until the first report.

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
points: `ChatView` (`src/shared/ui/chat-view/ChatView.tsx` → `JsChatView.tsx` on `@legendapp/list`),
`InputBar` (`src/shared/ui/input-bar/InputBar.tsx` → `JsInputBar.tsx`, core `ChatInputBar.tsx` shared
with `JsChatView`), `ContextMenuView` (see `project_components.md`). Audio capture/playback in the JS
ports is abstracted (`chat-voice-player.ts` / `chat-voice-recorder.ts` in `chat-view/model/`) with
simulated default backends — real backends can be injected via `setChatVoicePlayerBackend` /
`setChatVoiceRecorderBackend` (no audio native module exists in this project).

**Обновление списка на тысячи сообщений (задержка после голосования/удаления):** всё держится на
сохранении идентичности. `ChatMessageParser` (`model/chat-message-parser.ts`) кеширует
`parseChatMessage` по входному `ChatMessage` (объект переиспользуется, пока не изменился сам вход),
`ChatRowsBuilder` (`model/chat-rows.ts`) переиспользует `ChatRow`, пока не изменились её входы, а
`ChatList.tsx` передаёт списку `itemsAreEqual` и стабильный `renderItem` без замыканий — `LegendList`
перерисовывает ровно те контейнеры, чьи строки реально изменились. Обязательное требование к хосту:
`messages` должен сохранять идентичность неизменённых элементов — демо кеширует `mapMessageToNative`
по DTO (`useChatRoomMock.nativeMessages`). Оверлеи (`components/chat-overlay-store.ts`) читают поля по
одному через `useOverlayValue`, покадровый сдвиг плашки даты — shared value стора, так что кадр
скролла не вызывает ни одного ре-рендера корня.

### Keyboard compensation in the JS ports (port of `updateCollectionInsets`)

The native reference never moves the list: `collectionView` is pinned to all four edges of the
controller's view, the input bar hangs on `view.keyboardLayoutGuide.topAnchor`, and the zone the bar +
keyboard occlude is compensated **inside the scroll content** — `contentInset.bottom = (view.height -
inputBar.frame.minY) + collectionBottomPadding`, with `contentOffset` corrected by the same delta so
`distanceFromEnd` is preserved (and left alone when the content is shorter than the viewport).

The RN ports mirror that exactly, and this is load-bearing: any approach that translates/shrinks the
list container instead pushes the top of the content above the clip bounds, making the first messages
permanently unreachable.

The compensation lives in its own module, **`shared/lib/keyboard/`** — it knows nothing about chat and
is used by every screen with a floating bottom bar (`JsChatView`, `shared/ui/keyboard-scroll-view/
KeyboardScrollView.tsx`, the ui-kit-demo InputBar page).

### Single source of shift (the load-bearing property)

The reference's key property is not the formula but that there is exactly **one** driver: the bar hangs
on `keyboardLayoutGuide`, and the collection inset is derived from `inputBar.frame.minY` — the list
follows the *bar*, not the keyboard separately. They cannot drift apart by construction.

The port keeps that: one `bottomInset` shared value (`overlay + barHeight + chat padding`) drives both
the bar's `translateY` (`KeyboardFloatingView`) and the list's zone, read in the same UI-thread frame.

- Zone lives as a **spacer at the end of the content** (`ListFooterComponent`), not as `contentInset`:
  Android has no inset, and a spacer counts toward content size, so `scrollToEnd`, autoscroll and every
  "are we at the bottom" computation stay correct without corrections.
- The only state is `appliedInset` — how much is already reflected **both** in the spacer and in the
  scroll position. Each change is a delta from it, the scroll moves by the same delta, distance-to-end
  is preserved. Self-healing: any number of missed events collapses into one correct step.
- The hook reads the real position itself via `useScrollViewOffset(scrollRef)`, so the delta is always
  computed from where the scroll actually is. It is deliberately **not** supplied from outside: an
  earlier version had `ChatList` feed it through `sharedValues.scrollOffset`, which left plain
  `KeyboardScrollView` consumers with no writer at all and a base that went stale after any manual
  scroll. Consumers now only hand over `scrollRef`.

**JS-читаемые значения для решений из JS-обработчика.** Все shared values нижней зоны живут на
UI-потоке, читать их из JS нельзя. Для случаев, где решение принимается из JS (центрирование
`scrollToMessage` при открытой клавиатуре), добавлены синхронные геттеры: `useKeyboardHeight`
отдаёт `getHeight()` (зеркало в ref, обновляется на событиях клавиатуры через `scheduleOnRN`), а
`useKeyboardInset` — `getContentInset()` (`max(height, safeArea) + barHeight + extraPadding`,
`barHeight` тоже зеркалится в ref в `setBarHeight`).

**`scrollToMessage` центрирует по видимой области, а не по вьюпорту.** LegendList центрирует элемент
в полном вьюпорте, но при открытой клавиатуре видимая область короче на нижнее перекрытие. Хак
через штатный `viewOffset`: `viewOffset = -viewPosition * getContentInset()` — из
`calculateOffsetWithOffsetPosition` (`offset -= viewOffset`) выходит ровно
`offset = top - viewPosition * (viewport - bottomInset - itemSize)`, т.е. видимый центр совпадает с
центром области над клавиатурой. Отрицательный `viewOffset` лишь расширяет внутренний кламп LegendList
на `viewPosition * bottomInset`, а нативный скролл всё равно упирается в `contentSize - viewport`, так
что сообщение у самого низа просто прижимается к нижней границе, не уходя под клавиатуру.

**`KeyboardChatScrollView` was tried and rejected (twice, for different reasons).** Most recently: it
subscribes to the keyboard itself and drives the position with its own computation — a second source of
motion. In `onStart` it sets `padding` straight to the full keyboard height while catching the scroll
position up separately, so with the bar riding native progress per frame **the list visibly lagged
behind the bar**. Earlier its `useFrozenPadding` also reset stored padding to the live keyboard height
on `freeze → false`. Both classes of bug disappear once we own the single driver — so use
`AnimatedLegendList` from `@legendapp/list/reanimated`, not `KeyboardAwareLegendList`.

### Interactive dismiss

`keyboardDismissMode="interactive"` (iOS) is a port of the reference's `.interactive`. Two things make
it work, and both are easy to drop by accident:

1. `use-keyboard-height.ts` handles `onInteractive` per frame just like `onMove`, so the bar and the
   zone track the finger and stop when it stops.
2. **`updateCollectionInsets` returns early while `isUserDragging`** — it updates the inset but leaves
   `contentOffset` alone. `use-scroll-compensation.ts` ports that guard: the spacer still grows/shrinks,
   but no `scrollTo` is issued while the finger is down. Without it the compensation fights the gesture
   (the content is already following the finger) and the list scrolls down on its own during dismissal.
   That is why `onScrollBeginDrag`/`onScrollEndDrag` from the hook are **required** wiring, not optional.

**Verified working by the user — do not regress either half.**

### Spacer vs `contentInset`: range readiness

The spacer has one cost `contentInset` does not: height is a **layout** property, so the native
`contentSize` updates a frame later. The input bar has no such cost — it rides a `translateY`
transform, which Reanimated writes straight to the view on the UI thread. At the very bottom that
asymmetry is visible: `scrollTo` keeps hitting a range that has not grown yet, so the content appears
to chase the bar. Scrolled up it is invisible, because the clamp never binds.

Fix: the spacer grows by the **target**, not the current value. `onStart` reports the final keyboard
height before the animation begins (`useKeyboardHeight.targetHeight` →
`useKeyboardOverlay.overlayTarget` → `useScrollCompensation(bottomInset, reservedInset)`), so the range
is ready by the first frame of motion and nothing gets clamped. The position still animates per frame
off `bottomInset`; the reserve sits below the fold and is not visible. On interactive dismiss the
target simply tracks the current height — a gesture has no destination.

Both consumers must pass the reserve: `JsChatView` and `KeyboardScrollView` (`overlayTarget` prop).

### Spacer vs `contentInset`: the at-the-bottom residue

The zone is a spacer, and that has one consequence worth knowing. The reference's `contentInset.bottom`
widens the scrollable range **immediately**; a spacer's height goes through layout, so the native
`contentSize` lags a frame. At the very bottom the compensation asks for the maximum offset every
frame, and the native scroll view clamps it to a `contentSize` that has not grown yet — the last
message ended up slightly lower than it should. Scrolled up, the upper clamp never bites, so it was
only visible at the bottom.

`maintainScrollAtEnd={{ on: { footerLayout: true } }}` was tried for this and **must not be used**: it
drives the scroll from layout commits, which is a second source of motion, and the whole shift started
lagging behind the keyboard again — the same class of bug as `KeyboardChatScrollView`.

`pendingEndPin` remains as a safety net for any commit that still lands late. When the primary reaction clamps at
the end it arms a one-shot flag; the `contentHeight` reaction then re-sends the end offset once the
range has actually grown. It only ever *increases* the offset toward the end, is disarmed by the next
frame or by `onScrollBeginDrag`, and never leads the motion — so it cannot lag and cannot hijack cases
like prepend, where `maintainVisibleContentPosition` owns the position.

### Freeze: only the content inset

`useKeyboardInset.freeze()` / `.restore()` hold **only the content inset** (`contentInset`, `scroll`).
`barOffset` / `barStyle` stay live, so the input bar rides the keyboard down as usual.

That is the reference: `updateCollectionInsets` bails out on `isInsetFrozen`, holding the collection's
inset, while the bar's constraint on `keyboardLayoutGuide.topAnchor` is never touched. The context menu
snapshots the bubble, so the thing that must not move is the *content*; the bar is not in the snapshot,
and stopping it mid-screen reads as a stuck view. An earlier version froze the shared overlay and thus
both — wrong, do not go back to it.

`restore()` deliberately does **not** unfreeze synchronously: it flags intent and refocuses, and the
thaw happens from a reaction once the live inset has caught up with the frozen one (plus a `600 ms`
fallback). The mechanic itself is keyboard-agnostic and lives in
`shared/lib/hooks/use-freezable-value.ts` (`useFreezableValue`) — it freezes any shared value and waits
for the live one to catch up; `useKeyboardInset` only chooses *which* value to freeze.

**One hook per screen: `useKeyboardInset`.** It owns the whole chain and hands each concern out as its
own value, so everything is wired explicitly: `barStyle` / `barOffset` → the floating bar and the FAB,
`contentInset` → whatever sits above the zone, `scroll` → the scroll view, `freeze()` / `restore()` →
the context menu. Exactly one instance per screen — a second one means a second keyboard subscription
and the bar drifting away from the content.

Both wrappers are purely presentational and create nothing: `input-bar/KeyboardInputBar.tsx` (absolute
bottom + the passed `barStyle`) and `shared/ui/keyboard-scroll-view` (takes `scroll={kb.scroll}`).

Underlying hooks, each an independently reusable responsibility: `use-keyboard-height.ts` (raw height
+ target height + JS-readable `isVisible()`) and `use-scroll-compensation.ts` (spacer + scroll delta).
The freeze mechanic is not keyboard-specific and lives outside the module, in
`shared/lib/hooks/use-freezable-value.ts`. The zone arithmetic
(`max(keyboard, safeArea) + barHeight + padding`) lives inline in `use-keyboard-inset.ts` — it is glue
for the facade, not a separate concern, and keeping it there makes the whole calculation readable in
one place.

**Constraints for future changes:** do not reintroduce a second keyboard subscription for the list; do
not translate/shrink the list container (it pushes the top of the content past the clip bounds and the
first messages become unreachable); do not hardcode bottom paddings.

## Not verified / needs a human

- Contents of the external `IOSChatView` pod (sibling repo `rn-chat-view`) — out of scope for this repo's
  documentation; assume it can change independently of this repo.
- (resolved) ContextMenu has no Android native implementation; the stale in-repo comment claiming one
  was removed together with the old demo wrapper. Android is covered by the JS implementation
  (`shared/ui/context-menu-view/ContextMenuView.tsx`).
- The `ios:Stg-Release` npm script typo (`'rnapp.stagingReleasse'`) — confirm whether this is a known bug
  or intentional before "fixing" it.
