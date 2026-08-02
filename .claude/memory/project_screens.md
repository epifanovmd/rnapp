---
name: Screens & Navigation
description: Экраны — public/private, tabs, stack, NavigationService
type: project
---

- **Public** (`src/pages/`): SignIn, SignUp, RecoveryPassword.
- **Private — табы** (`MAIN`, `src/app/app-tab-screens.tsx`): Main, Playground, Settings.
- **Private — стек** (`src/app/App.screens.ts`): MAIN + Components/Carousel/Chat/Charts/ContextMenu/
  PdfView/WebView (демо; всё `pages/ui-kit-demo/` — демо-контент).
- `App.navigator.tsx` выбирает маршруты по `IAuthStore.isAuthenticated`: unauth → PUBLIC, auth →
  `{...PRIVATE, ...PUBLIC}`.
- `NavigationService` (`shared/lib/navigation/navigation.service.ts`) — императивная навигация вне React.
- Deep linking — `app/App.linking.ts` (схема из `DEEPLINK_BASE_URL`).

Детали — в `src/app/App.screens.ts`, `app-tab-screens.tsx`, `App.navigator.tsx`.
