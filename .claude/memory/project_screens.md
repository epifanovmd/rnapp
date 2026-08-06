---
name: Screens & Navigation
description: Экраны, навигация, NavigationService
type: project
---

- `src/pages/` сгруппированы по навигаторам: `pages/tabs/<slice>` и `pages/stack/<slice>`
  (boundaries-паттерн `src/pages/*/*/**`, capture group+slice).
- **Public** (`pages/stack/`): SignIn, SignUp, RecoveryPassword.
- **Private — табы** (`MAIN`, `src/app/app-tab-screens.tsx`, `pages/tabs/`): Main, Playground,
  Settings.
- **Private — стек** (`src/app/App.screens.ts`, `pages/stack/`): MAIN + Components/Carousel/
  Chat/Charts/ContextMenu/InputBar/PdfView/WebView.
- `App.navigator.tsx`: unauth → PUBLIC, auth → `{...PRIVATE, ...PUBLIC}`.
- `NavigationService` (`shared/lib/navigation/navigation.service.ts`) — императивная навигация.
- Deep linking — `app/App.linking.ts`.
