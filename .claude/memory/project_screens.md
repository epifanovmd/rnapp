---
name: Screens & Navigation
description: Экраны приложения — public/private, tabs, stack, навигационная структура
type: project
---

## Public screens (unauthenticated) — `src/pages/`
- **sign-in** (`SignIn.tsx`) — login form, GitHub OAuth link, biometric unlock, 2FA verification
- **sign-up** (`SignUp.tsx`) — registration (email/phone validation via zod)
- **recovery-password** (`RecoveryPassword.tsx`) — password recovery

## Private screens — tab navigator (`MAIN` route, `src/app/app-tab-screens.tsx`)
Order/keys of `TAB_SCREENS` (initial route: `Main`):
- **Main** — `pages/ui-kit-demo/tabs/main/Main.tsx` — home/demo screen (image header + refreshable card list)
- **Playground** — `pages/ui-kit-demo/tabs/playground/Playground.tsx` — dev/test scratch screen, holds
  buttons to every stack demo screen below (Components/Carousel/Chat/Charts/ContextMenu/PdfView/WebView)
- **Settings** — `pages/settings/Settings.tsx` — app settings, biometrics toggle, theme switch

There is no "Chats" tab — the chat demo is a stack screen (see below), reached from Playground, not a
tab bar root.

## Private screens — stack routes (`src/app/App.screens.ts`, `PRIVATE_SCREENS`)
- **MAIN** — the tab navigator above (`headerShown: false`)
- **Components** — `pages/ui-kit-demo/stack/components/Components.tsx` — component showcase with its
  own internal Material Top Tabs (`TopTabNavigation`): **Buttons**, **Notifications**, **Modals**,
  **Pickers**, **Elements**, **Ticket** (`ButtonsTab`, `NotificationsTab`, `ModalsTab` [+`CustomFilter`],
  `PickersTab`, `ElementsTab`, `TicketTab`)
- **Carousel** — `pages/ui-kit-demo/stack/carousel/Carousel.tsx` (+ `SlideItem.tsx`)
- **Chat** — `pages/chat` → re-exports `widgets/chat-room`'s `ChatRoom` (native chat demo, fully mocked),
  `headerShown: false` (renders its own `Navbar`, now including `Navbar.BackButton` since it's pushed
  from Playground rather than mounted as a tab root)
- **Charts** — `pages/ui-kit-demo/stack/charts/Charts.tsx` — Skia + Reanimated charting core demo (see
  `project_charts.md`); Line/Area/Bar chart cards with Grid/Axis/Crosshair/Tooltip
- **PdfView** — `pages/ui-kit-demo/stack/pdf-view/PdfView.tsx` — modal presentation
  (`forModalPresentationIOS`, `gestureEnabled: false`, `headerShown: false`)
- **WebView** — `pages/ui-kit-demo/stack/web-view/WebView.tsx` — same modal presentation as PdfView

Everything under `pages/ui-kit-demo/` is demo/playground content; the "real" app screens are
`pages/{sign-in,sign-up,recovery-password,chat,settings}/`.

## Navigation structure

```
App.navigator.tsx (routes chosen from IAuthStore.isAuthenticated)
├── !isAuthenticated → PUBLIC_SCREENS
│   ├── SignIn
│   ├── SignUp
│   └── RecoveryPassword
└── isAuthenticated → { ...PRIVATE_SCREENS, ...PUBLIC_SCREENS }  (both merged)
    ├── MAIN (bottom TabNavigator, TabHeader = <Navbar>)
    │   ├── Main       (ui-kit-demo)
    │   ├── Playground (ui-kit-demo — links to Components/Carousel/Chat/Charts/ContextMenu/PdfView/WebView)
    │   └── Settings
    ├── Components (internal Material Top Tabs: Buttons/Notifications/Modals/Pickers/Elements/Ticket)
    ├── Carousel
    ├── Chat (ChatRoom, native chat demo)
    ├── Charts (Skia + Reanimated charting core demo)
    ├── ContextMenu (context menu demo: native RNContextMenuView vs JS ContextMenuView, toggle on page)
    ├── PdfView (modal)
    ├── WebView (modal)
    ├── SignIn / SignUp / RecoveryPassword (still addressable even while authenticated)
```

Stack header is `AppHeader` (`App.navigator.tsx`) — a `Navbar` with `Navbar.BackButton` and a
`SwitchTheme` toggle in `Navbar.Right`; card transition is `stackTransition` from `app/common/`.

## NavigationService (`src/shared/lib/navigation/navigation.service.ts`)
- IoC singleton (`@injectable`), wraps a module-level `navigationRef` (`createNavigationContainerRef`).
- `subscribe()` — attaches a `"state"` listener that tracks `currentScreenName` and a flattened
  `history` array (`{ screen, params }[]`, recursively expands nested navigator state).
- `navigateTo`, `pushTo`, `replaceTo` (via `StackActions.push`/`.replace`), `goBack`, `canGoBack`,
  `isReady` — all guarded by `isReady`/`canGoBack` checks so calls before the navigator mounts are no-ops.
- Debug logging of nav history gated by `DebugVars.logNavHistory` (`template/debugVars.ts`).
- Used for imperative/programmatic navigation from stores/services (outside React component tree).

## AppNavigator (`src/app/App.navigator.tsx`)
On `NavigationContainer`'s `onReady`: calls `authStore.restore()` (session restore from stored tokens),
then if biometrics are `available` and still not authenticated, triggers `authorization()`
(`features/biometric`); finally triggers a light haptic and hides the boot splash
(`react-native-bootsplash`) after a 500ms delay.
