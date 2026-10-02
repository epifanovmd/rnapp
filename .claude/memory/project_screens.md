---
name: Screens & Navigation
description: Экраны, навигация (RN7 static API), NavigationService
type: project
---

- Навигация — React Navigation 7 **static API**: `app/App.screens.ts` —
  `RootStack = createStackNavigator({ groups })` с guard-группами
  `Private` (`if: useIsSignedIn`) / `Public` (`if: useIsSignedOut`); при смене
  auth-состояния стек переключается автоматически (ручной navigate после
  login/logout не нужен).
- `src/pages/` сгруппированы по навигаторам: `pages/tabs/<slice>` и `pages/stack/<slice>`
  (boundaries-паттерн `src/pages/*/*/**`, capture group+slice).
- **Public** (`pages/stack/`): SignIn, SignUp, RecoveryPassword.
- **Private — табы** (`Tabs`, `src/app/app-tab-screens.tsx` → `MainTabs`, `pages/tabs/`):
  Main, Playground, Settings.
- **Private — стек** (`src/app/App.screens.ts`, `pages/stack/`): Tabs + Components/
  Chat/ContainerScanner/ObjectScanner/PdfView/PlateScanner/TextScanner/WebView.
- **Плейграунд кита** — `Components` (ссылки) + демо-экраны `Components<Name>`
  (`pages/stack/components/demos/`): виды компонентов, Charts, Calendar, Calendar list,
  Context menu, Input bar, Tabs, ScreenReady.
- **Chat** (`pages/stack/chat`) — тонкая страница: моковые сообщения (`useChatMessages`)
  - `ChatView` из `widgets/chat`; позиция скролла живёт в MMKV по `chatId`.
- Типизация: глобальный `ReactNavigation.RootParamList` выводится из static-конфига
  (регистрация `RootNavigator` в `App.navigator.tsx`); параметры экрана — рядом со
  страницей через `ScreenProps<Params>`; central param-list'ов/enum'ов нет.
  Вложенные top-tabs `Components` — локальный param list
  (`pages/stack/components/components.types.ts`).
- `shared/lib/navigation/` — только инфраструктура: `navigationRef`, `NavigationService`
  (императивная навигация вне React, MobX `currentRouteName`/`activePath`),
  `useNavigation()`/`useRoute<Name>()`.
- Бутстрап (restore, биометрия, splash) — `app/hooks/useAppBootstrap.ts` (onReady).
- Deep linking — пути в static-конфиге (`linking:` у экранов), `app/App.linking.ts` —
  prefixes + `enabled: "auto"`.

## Аккаунт (покрытие API шаблона бэкенда)

Вход — вкладка Settings, список ссылок `ACCOUNT_LINKS` (`pages/tabs/settings/Settings.tsx`).
Экраны стека (`App.screens.ts`, заголовок из `options.title`):

- **Profile** (`pages/stack/profile`) — `features/profile-settings`: `AvatarPicker`
  (upload случайного фото через `shared/lib/files.downloadSampleImage` → `IFileStore.upload`
  → `updateProfile({ avatarId })`, выбор из своих изображений, снятие `avatarId: null`),
  `ProfileForm` (пустые поля → `null`, `toProfileUpdate`), `PrivacySettingsForm`.
- **Security** (`pages/stack/security`) — `features/account-security`: email (смена
  `updateMyUser` → `confirmEmailChange`; подтверждение текущего `requestVerifyEmail`/`verifyEmail`),
  username (регэксп как на сервере `^[a-z0-9_]{5,32}$`), пароль, 2FA (второй пароль; статуса 2FA
  в UserDto нет — режим включить/выключить выбирается вручную), удаление аккаунта (Alert + пароль);
  `SessionsSection` (ISessionStore) и `SignOutAllButton` (`features/sign-out`).
- **Audit** (`pages/stack/audit`) — `entities/audit` `AuditStore`: `CursorHolder` +
  приватный `nextCursor` сервера (курсор непрозрачный, keyExtractor-курсоры холдера не используются).
- **Files** (`pages/stack/files`) — `entities/file` `FileStore` (InfiniteHolder, `file:processed`
  через `FileRealtime`) + `features/file-upload` (фото/текстовый файл; пикера галереи в проекте нет).
- **Jobs** (`pages/stack/jobs`) — `entities/job` `JobStore` (InfiniteHolder, `handleJobUpdated`
  upsert/prepend по `job:updated` через `JobRealtime`); демо `demo.echo` показывается только админам.

Realtime-подписки file/job стартуют и сторы file/job/audit сбрасываются в `AppDataStore`
по `isAuthenticated`.
