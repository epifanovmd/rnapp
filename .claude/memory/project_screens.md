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
- **Public** (`pages/stack/`): SignIn, SignUp, RecoveryPassword — все `NO_HEADER`, тонкие
  страницы: `widgets/auth-layout` `AuthLayout` (kit `KeyboardAwareScrollView`, safe-area сверху/снизу,
  логотип-иконка `shieldCheck` на `primary`, `APP_NAME` + карточка `surface` radius 20 + «Версия
  `APP_VERSION`»; оба из `shared/config/app-info.ts` через device-info — `getApplicationName()` =
  DISPLAY_NAME сборки) + форма фичи. Ссылки между экранами — `Button appearance="link"`.
  - `features/sign-in` `SignInForm` (`onForgotPassword`, `onSignUp`, `alternatives` — слот под «или»):
    логин/пароль, «Забыли пароль?», 2FA `TwoFactorPrompt` (второй пароль + подсказка, заменяет
    FormSubmit), GitHub OAuth (`loginByGithub`, outline + `externalLink`). Биометрия — из
    `features/biometric` `BiometricSignInButton` в слот `alternatives` (фича не импортирует фичу).
  - `features/sign-up` `SignUpForm`: имя/фамилия (необяз.) + логин + пароль×2; `toSignUpRequest`
    (чистый, тест) — email/phone по логину, пустые имена не шлются.
  - `features/recovery-password` `RecoveryPasswordForm`: после `requestResetPassword` — состояние
    «Письмо отправлено» (`RecoveryPasswordSuccess`, текст сервера), без автоперехода.
  - Passkeys в клиенте нет (только API в gen); `resetPassword({token,password})` в API есть, экрана нет.
- **Private — табы** (`Tabs`, `src/app/app-tab-screens.tsx` → `MainTabs`, `pages/tabs/`):
  Main, Playground, Settings. Settings — `Container edges top` + `Navbar` + `ScreenScroll` с
  `widgets/app-menu` `AppMenu`: `AppMenuProfile` (ListItem + Avatar, → Profile), группы
  `APP_MENU_GROUPS` (Аккаунт: Security/Audit; Данные: Files/Jobs) в `AppMenuGroup` (Section pa 8),
  группа «Приложение» — `ThemeMenuItem` (widget, Switch Light/Dark) + `BiometricMenuItem`
  (`features/biometric`, без датчика не рендерится), `SignOutButton` (outline danger + confirm), версия.
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
- Бутстрап — `app/hooks/useAppBootstrap.ts` (onReady): `authStore.restore()` + `IBiometricStore.load()`
  параллельно, скрытие splash, затем (нет сессии) `biometricStore.signIn({ auto: true })` — тихая отмена.
- Deep linking — пути в static-конфиге (`linking:` у экранов), `app/App.linking.ts` —
  prefixes + `enabled: "auto"`.

## Аккаунт (API бэкенда)

Вход — вкладка Settings (`widgets/app-menu`, см. выше).
Экраны стека (`App.screens.ts`, заголовок из `options.title`):

- **Profile** (`pages/stack/profile`, `ScreenScroll` + PTR, `ScreenState`) — секция «Аватар»
  (`features/profile-settings` `AvatarPicker`: фото из галереи/камеры через ActionSheet →
  `IFileStore.upload` → `updateProfile({ avatarId })`, выбор из своих изображений, снятие `null`),
  `ProfileDetails` (SettingsGroup + ValueRow; «Личные данные» по нажатию открывают правку,
  «Контакты» — email/статус/телефон/роль), `PrivacySettingsForm`, дата регистрации. Правка —
  `features/edit-profile` `EditProfileModal` (ModalSheet, кнопка `edit` в `headerRight`): имя,
  фамилия, пол, `DateFormField` даты рождения (maxDate — сегодня), locale; значения из стора
  (`values` + `keepDirtyValues`), сброс в `onClosed`, `useLeaveConfirmation` при dirty.
  `profile-form-values.ts` (тест): ISO → локальная дата, пустое → `null`, дата уходит
  `yyyy-MM-dd` без сдвига UTC.
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

## Узлы и агенты (модули бэкенда node и agent)

Вход — группа «Инфраструктура» в `widgets/app-menu` (пункты с `permission`: «Узлы» —
`node:view:own`, «Агенты» — `agent:view`; без права пункта нет).

- `entities/agent` — `IAgentsStore` (`AgentsStore`: список, проблемы, сборки, отложенные замены
  воркеров), `useAgentsRealtime` (комната `agents`, `agent:updated/deleted/alert`, `agent:release` →
  перечитать сборки + тост с `key` по версии), `useAgentLog` (`agent:log`, уровень — `agent:log-level`),
  `useAgentLiveMetrics`/`useAgentMetricsHistory`, `useAgentEventFeed`; чистые `lib/` (release, metrics,
  schema, status, format, log) — с тестами.
- `entities/node` — `INodesStore` (список, `fetch(id)`, нагрузка `node:load`), `useNodesRealtime`
  (комната `nodes` при области «все», события — при любой), статус/фильтр/адрес, `NodeStatusTag`.
- features: `manage-node` (форма, удаление), `assign-node-owner`, `provision-node-agent` (команда установки
  или SSH; воркеры с сервера, по умолчанию все; удаление по SSH), `enroll-agent` (токены регистрации,
  секрет один раз, команда установки с параметрами), `manage-agent` (`useAgentActions`, `useWorkerActions`
  с отложенной заменой и «заменить сейчас», `useWorkerActionResults` по `agent:action`,
  `agentActionItems`), `edit-worker-config` (только с правом на настройки: значение сервер отдаёт лишь с
  `agent:config`/`node:agent`), `fetch-agent-worker` (простой запрос к воркеру, `responseType: "text"`,
  статус воркера — заголовок `X-Agent-Worker-Status` у `HttpError`).
- `widgets/agent-tabs` — `AgentTabsNavigator` (material top tabs под `HiddenBar`): «Обзор» (контент экрана
  - метрики агента), «Воркеры», «Настройки», «Запрос» (`canFetch`), «События», «Журнал»; без агента —
    только «Обзор». Права вкладок `IAgentTabsAccess` считает экран.
- Экраны стека: `Nodes` (список, связность `node:mesh`, поиск, «Все/Мои»), `NodeDetail` (`nodes/:nodeId`,
  без шапки стека; права — `nodeAccess`: право узла на свой/все узлы или право раздела агентов; агент
  показывается, только пока он агент этого узла), `Agents` (отбор, поиск, проблемы, установка),
  `AgentDetail` (`agents/:agentId`).
- Журнал действий (`pages/stack/audit`) — `agentAuditTitle` делает читаемыми `agent.action` и
  `agent.action-result`.
- В тестах барели `@entities/agent|node` подменяются `jest.requireActual` чистых модулей (барель тянет UI и
  нативные модули).
