---
name: Components Library
description: UI-компоненты — shared/ui kit, widgets/chat-room, widgets/app-shell, compound components, slots
type: project
---

Generic, business-agnostic UI lives under `src/shared/ui/`. The only UI piece pulled out of the shared
kit is `TabBar`, which lives in `src/widgets/app-shell/` because it's compositionally tied to app
navigation (only used from `src/app/app-tab-screens.tsx`).

## Layouts (`src/shared/ui/layouts/`)
- `Container` — SafeAreaView wrapper
- `Content` — ScrollView wrapper
- `RefreshingContainer` — pull-to-refresh wrapper
- `StatusBar` — StatusBar configuration

## Navbar (`src/shared/ui/navbar/`) — compound component via slots
- `Navbar` (`Navbar.tsx`) is the shell; slots created with `createSlot`: `BackButton`, `Left`, `Content`,
  `Title` (`NavbarTitle.tsx`), `Subtitle` (`NavbarSubTitle.tsx`), `Right`. Also `NavbarIcon.tsx`.
- Resolves slot children via `useSlotProps(Navbar, children)` (`@shared/lib/slots`) — see
  `project_patterns.md` for the exact call shape.
- Used both as the stack header (`App.navigator.tsx`'s `AppHeader`) and the tab header
  (`app-tab-screens.tsx`'s `TabHeader`).

## UI primitives (`src/shared/ui/`)
- `button/Button.tsx` — variants + loading state (`hooks/useButtonStyles.ts`)
- `input/Input.tsx`, `input/TextField.tsx` — text inputs with `mergeRefs`
- `bottom-sheet/` — `@gorhom/bottom-sheet` wrapper, compound: `BottomSheetContent`, `BottomSheetFooter`,
  `BottomSheetHeader`, `BottomSheetBackdrop`
- `dialog/` — `Dialog.tsx` + `DialogHost.tsx` (imperative host mounted once in `App.tsx`)
- `touchable/Touchable.tsx` — haptic-feedback-aware pressable
- `text/Text.tsx` — typography (`text-styles.ts`), theme-aware
- `icon/Icon.tsx` — `lucide-react-native` + custom icons in `icon/icons/` (BackIcon, Camera, Check,
  CheckBold, CloseCircle, CloseIcon, Document, EyeIcon, EyeOffIcon, Image, SaveIcon, SearchIcon)
- `check-box/CheckBox.tsx`, `chip/Chip.tsx`, `switch/Switch.tsx`, `tabs/{Tab,Tabs}.tsx`
- `field/Field.tsx` — compound form-field wrapper
- `scroll-view/ScrollView.tsx` — enhanced ScrollView
- `image/Image.tsx` — `react-native-fast-image` wrapper
- `picker/` — `DatePicker`, `RangePicker`, `TimePicker`, `YearRangePicker`, built on `picker/shared/`
  (`NativePicker.tsx` wraps the native WheelPicker; `Picker.tsx`, `PickerColumn.tsx`, `PickerItem.tsx`)
- `carousel/Carousel.tsx` — Reanimated-based carousel
- `context-menu-view/` — long-press context menu (emoji reactions + action list), two interchangeable
  implementations with an identical props/events contract (`types.ts`, derived from the codegen spec).
  Structure: `native/` (`NativeContextMenuView.tsx` wrapping native `RNContextMenuView` (iOS only) +
  `NativeContextMenuViewSpec.ts` codegen spec); `ContextMenuView.tsx` (root — the single public entry
  point: resolves per platform, iOS → NativeContextMenuView, elsewhere → JsContextMenuView);
  `JsContextMenuView.tsx` (cross-platform JS port on Reanimated + Gesture Handler — deliberately thin
  per-item: just a View + long-press gesture, safe for large lists); `context-menu-controller.ts` (singleton present/finish store — mirrors the native
  single-presented-VC model); `menu/` (`ContextMenuHost` — the single overlay render point, mounted once
  in App.tsx as `<ContextMenuView.Host />` (Dialog.Host pattern); `ContextMenuOverlay` = fullscreen Modal
  with backdrop/scroll canvas, `ContextMenuEmojiPanel`, `ContextMenuActionsView`, `ContextMenuBackdrop`,
  `SfSymbolIcon` — SVG stand-ins for SF Symbols); `utils/` (pure layout engine `context-menu-layout.ts`,
  theme port `context-menu-theme.ts`); `hooks/useContextMenuAnimator.ts`. See `project_native.md` for the native
  side. The former `holld-item-menu/` (HoldItem) component was removed in favour of this one
- `image-viewing/` — gallery viewer: `ImageViewing.tsx`, double-tap-to-zoom, pan responder, platform
  image item (`ImageItem.ios.tsx`/`ImageItem.android.tsx`/`ImageItem.d.ts`)
- `collapsable/Collapsable.tsx` — collapsible section
- `animated-refreshing/AnimatedRefreshing.tsx` — animated pull-to-refresh indicator
- `ticket/Ticket.tsx` — card/ticket-style component (also has a page-local variant in
  `pages/ui-kit-demo/stack/components/tabs/Ticket.tsx` for the demo)
- `title/Title.tsx`
- `actions/` — `SwitchTheme.tsx` (theme toggle button), `NavLink.tsx`
- `flex-view/` — `FlexView.tsx`, CSS-like flex props for RN Views; `utils/createFlexViewComponent.tsx`
  (HOC), plus style converters (`flex-props-converter.ts`, `flex-props-map.ts`, `shadow-style.ts`,
  `style-map-generator.ts`)
- `chart/` — Skia + Reanimated charting core (`Chart` root + pluggable layer components: `LineLayer`,
  `AreaLayer`, `BarLayer`, `ScatterLayer`, `GridLayer`, `AxisLayer`, `CrosshairLayer`, `MarkerLayer`,
  `ReferenceLineLayer`, `Legend`, `ActivePointListener`, `TooltipLayer`; touch-driven layers expose
  press/change events — `onBarPress`, `onMarkerPress`, `onPointPress`, `onActiveChange`,
  `onVisibilityChange`). Unlike every other piece of this kit, it deliberately does **not** depend on
  `@shared/lib/theme` or any other `@shared/ui/*` component, and has **no shared theme object at all** —
  every layer takes its own color/style props with literal defaults declared in that component; a
  consumer bridges the app's real theme in per-prop, per-layer, at the call site. Also has no code
  comments — the "why" lives in `project_charts.md`, which has the full architecture.
  Demoed on `pages/ui-kit-demo/stack/charts/Charts.tsx` (reached via a Playground button).

## Chat (`src/widgets/chat-room/`)
- `ChatRoom.tsx` — the chat screen widget. **Fully mocked** — no API/socket calls, state comes entirely
  from `useChatRoomMock.ts` (541 lines: message list, typing indicator, scroll/unread logic, reactions,
  polls, image viewer state, attachment sheet). `chat-mock-data.ts` (160 lines) supplies the seed data.
- `native/map-message-to-native.ts` — converts JS chat message model → `ChatMessage` prop shape.
  The ChatView/InputBar components themselves live in `shared/ui/chat-view` and `shared/ui/input-bar`
  (single entry points; iOS → native `RNChatView`/`RNInputBar`, elsewhere → full RN ports `JsChatView`
  on FlashList / `JsInputBar`). `ChatRoom.tsx` has a temporary native-vs-JS switch (deep imports of
  both implementations as a testing exception) for iOS side-by-side comparison.
- `AttachmentPickerSheet.tsx`, `PollDetailModal.tsx` — supporting UI for the chat screen

## App shell (`src/widgets/app-shell/`)
- `TabBar.tsx` — custom bottom tab bar renderer, passed as the `tabBar` prop to `AppNavigation` in
  `app/app-tab-screens.tsx`. The only widget-level UI component (rest of the kit is in `shared/ui`).

## Slots (`src/shared/lib/slots/`)
`createSlot(name)` creates a marker component; `useSlotProps(OwnerComponent, children)` /
`getSlotsProps` walk `children`, match each element's `type` against the owner's static slot properties
(keys starting with an uppercase letter), and return a props-by-slot-name object plus `$children` for
anything that didn't match a slot. This is the mechanism behind every compound component in
`shared/ui` (Navbar, BottomSheet, Field, ...). See `project_patterns.md` for a worked example.
