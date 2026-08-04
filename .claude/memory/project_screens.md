---
name: Screens & Navigation
description: Экраны, навигация, NavigationService
type: project
---

- **Public** (`src/pages/`): SignIn, SignUp, RecoveryPassword.
- **Private — табы** (`MAIN`, `src/app/app-tab-screens.tsx`): Main, Playground, Settings.
- **Private — стек** (`src/app/App.screens.ts`): MAIN + Components/Carousel/Chat/Charts/ContextMenu/
  PdfView/WebView (демо в `pages/ui-kit-demo/`).
- `App.navigator.tsx`: unauth → PUBLIC, auth → `{...PRIVATE, ...PUBLIC}`.
- `NavigationService` (`shared/lib/navigation/navigation.service.ts`) — императивная навигация.
- Deep linking — `app/App.linking.ts`.
