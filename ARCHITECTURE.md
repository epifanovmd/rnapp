---
name: Architecture
description: Feature-Sliced Design — структура src/, правила зависимостей, naming, DI, state, HTTP/auth, socket, ESLint
type: project
---

# Architecture Guide

## Feature-Sliced Design

Шесть слоёв, каждый следующий использует только нижние:

```
app → pages → widgets → features → entities → shared
```

```
template/src/
  app/                    ← композиционный корень
    App.tsx               ←   DI + провайдеры (Theme, SafeArea, BottomSheetModal, Keyboard, Dialog, ContextMenu)
    App.navigator.tsx     ←   createStaticNavigation + регистрация RootParamList
    App.screens.ts        ←   RootStack: static-конфиг, guard-группы Private/Public
    App.header.tsx        ←   общий header экранов стека
    app-tab-screens.tsx   ←   MainTabs: static-конфиг табов (Main/Playground/Settings)
    App.linking.ts        ←   deep linking (prefixes; пути — в static-конфиге)
    App.notifications.tsx ←   монтирует NotificationHost (in-app уведомления)
    app.module.ts         ←   регистрация всех *.module.ts (DI)
    app-data-*            ←   стор данных приложения

  pages/                  ← экраны — композиция widgets/features/entities под роут;
                            сгруппированы по навигаторам
    tabs/                 ←   экраны таб-навигатора: main/, playground/, settings/
    stack/                ←   экраны стека: sign-in/, sign-up/, recovery-password/, chat/,
                              carousel/, charts/, components/, context-menu/, input-bar/,
                              pdf-view/, web-view/

  widgets/                ← крупные самостоятельные блоки UI
    chat-room/            ←   ChatRoom + useChatRoomMock (мок-данные)
    app-shell/            ←   TabBar

  features/               ← интерактивные сценарии поверх entities
    sign-in/, sign-up/, recovery-password/
    biometric/            ←   useBiometric (sign-in + settings)

  entities/               ← бизнес-сущности — состояние и доменные модели
    auth/                 ←   model/ (AuthStore, validation, biometric, passkey), api/ (jwt, session, token)
    user/                 ←   model/ (store, session, realtime), lib/permissions

  shared/                 ← переиспользуемый код, не знает о бизнес-логике
    ui/                   ←   UI-кит (chat-view, input-bar, context-menu-view, ...)
    api/                  ←   HttpClient, ApiError, contract/, orval-gen (gen/)
    config/               ←   env.ts (react-native-config)
    lib/                  ←   di, holders, navigation, theme, socket, keyboard, storage, ...
```

Слайс (`entities/auth`, `features/sign-in`, ...) — самодостаточная папка с сегментами
`model/`, `api/`, `ui/`, `lib/`. У `shared` слайсов нет — сегменты (`ui/`, `api/`, `config/`,
`lib/`) сами по себе плоская коллекция независимых модулей.

## Правила зависимостей

Модуль слайса импортирует только слайсы строго нижних слоёв. Проверяется
`eslint-plugin-boundaries` ([eslint.boundaries.mjs](template/eslint.boundaries.mjs)),
`default: "disallow"`.

### Слайсы одного слоя не видят друг друга

`entities/auth` не импортирует `entities/user`, `features/sign-in` не импортирует
`features/sign-up`. Общая логика — слоем ниже. Пример: `loginValidation`/`passwordValidation`
используются в `features/sign-in` и `features/sign-up`, определены в
`entities/auth/model/validation.ts`.

### Разрешено

| Откуда | Куда | Пример |
|---|---|---|
| `shared` | `shared` | `shared/ui/chat-view` → `shared/lib/keyboard` |
| `entities` | `shared` | `entities/auth` → `@shared/lib/di` |
| `features` | `shared`, `entities` | `features/sign-in` → `@entities/auth` |
| `widgets` | `shared`, `entities`, `features` | `widgets/chat-room` → `@features/...` |
| `pages` | `shared`, `entities`, `features`, `widgets` | `pages/chat` → `@widgets/chat-room` |
| `app` | всё | `app/app.module.ts` → `@entities/auth/auth.module` |

### Запрещено

| Нарушение | Причина |
|---|---|
| Слайс → слайс того же слоя | Dependency Inversion — контракт в `shared` |
| Слой → слой выше | `entities/*` → `@features/*` |
| Self-import через свой же alias | внутри слайса — только относительные пути |

### Self-imports

Внутри слайса/сегмента — только относительные пути. Публичный alias самого себя запрещён
(`no-restricted-imports` в [eslint.config.mjs](template/eslint.config.mjs)).

```ts
// ✅ внутри entities/auth/api/session-guard.ts
import { IAuthStore } from "../model/types";

// ❌ там же
import { IAuthStore } from "@entities/auth";

// ✅ из features/sign-in в entities/auth
import { IAuthStore } from "@entities/auth";
```

### Контракты (Dependency Inversion)

Если `shared/lib` требует данные из `entities` — интерфейс в `shared`, реализация в `entities`:

```
shared/api/contract/token-source.contract.ts   ← ITokenSource
                                                     ↑ implements
entities/auth/api/token-source.ts              ← SessionService
```

## Navigation (React Navigation 7, static API)

- `app/App.screens.ts` — `RootStack = createStackNavigator({ groups })`: группы `Private`
  (`Tabs` = нижние табы + демо-стек) и `Public` (SignIn/SignUp/RecoveryPassword) с guard'ами
  `if: useIsSignedIn / useIsSignedOut` (`app/hooks/useIsSignedIn.ts`, MobX →
  `useSyncExternalStore`); при смене auth-состояния RN сам переключает стек, ручной
  `navigate` после login/logout не нужен.
- `app/app-tab-screens.tsx` — `MainTabs` (static-конфиг bottom tabs: Main/Playground/Settings)
  + `MainTabsLayout` (TransitionProvider для баров).
- `app/App.navigator.tsx` — `createStaticNavigation(RootStack)`; регистрирует корневой
  навигатор в `RootNavigator` (`@react-navigation/core`) — глобальный
  `ReactNavigation.RootParamList` выводится из static-конфига автоматически.
  Бутстрап (restore-сессия, биометрия, splash) — `app/hooks/useAppBootstrap.ts` в `onReady`.
- Типизация экранов: параметры объявляются рядом со страницей —
  `FC<ScreenProps<{ url: string }>>` (`ScreenProps` из `shared/lib/navigation`); центральных
  param-list'ов и enum'ов имён нет. Вложенные локальные навигаторы (top-tabs в
  `pages/stack/components/`) типизируются собственным param list рядом с собой.
- `shared/lib/navigation/` — инфраструктура без знания экранов: `navigationRef`,
  `NavigationService` (IoC-синглтон: navigate/push/replace/goBack/resetTo, MobX
  `currentRouteName`/`activePath`), хуки `useNavigation()`/`useRoute<Name>()`.
- Deep linking: пути — в static-конфиге (`linking:` у экранов), конфиг генерируется
  автоматически (`enabled: "auto"` в `app/App.linking.ts`; там же prefixes).

## State Management

### Сторы (MobX)

```
entities/auth/
  model/
    store.ts        ← класс MobX (AuthStore)
    types.ts        ← AuthStatus, IAuthStore (DI-токен)
  auth.module.ts    ← bind(IAuthStore.Tid).to(AuthStore).inSingletonScope()
```

Стор — состояние и переходы. Инфраструктура (токены, refresh) — в `api/`.
Регистрация — `ContainerModule` в `<slice>.module.ts`.
Зависимости — через DI: `@IAuthSessionService() private _session: IAuthSessionService`.

### Холдеры (async state)

`shared/lib/holders/`: entity, collection, paged, infinite, mutation, polling, base, cursor,
filter, hooks.

| Хук | Holder | Аналог |
|---|---|---|
| `useEntity` | `EntityHolder` | `useQuery` |
| `useCollection` | `CollectionHolder` | `useQuery` (list) |
| `usePaged` | `PagedHolder` | `useQuery` (paginated) |
| `useInfinite` | `InfiniteHolder` | `useInfiniteQuery` |
| `useMutation` | `MutationHolder` | `useMutation` |
| `usePolling` | `PollingHolder` | `useQuery` + refetchInterval |

Фичи: `{data} | {error}` (не кидают), cancellation, quiet refresh.

## DI (Inversify)

- Регистрация — `ContainerModule`, собираются в `app/app.module.ts` (`registerContainerModules`).
- Токен: `createInjectDecorator<T>()` (`shared/lib/di/`) — `.Tid`, `.getInstance()`, `.useInstance()`.

```ts
export const IAuthJwtService = createInjectDecorator<IAuthJwtService>();

@injectable()
export class AuthJwtService implements IAuthJwtService { ... }

export const authModule = new ContainerModule(({ bind }) => {
  bind(IAuthJwtService.Tid).to(AuthJwtService).inSingletonScope();
});
```

| Где | Как |
|---|---|
| React-компонент/хук | `IXxx.useInstance()` |
| Вне React | `IXxx.getInstance()` |
| Инъекция в конструктор | `@IXxx() private _svc: IXxx` |

## HTTP и авторизация

### Token lifecycle

```
TokenStorage → SessionService (ensureFreshToken, refresh) → HttpClient (interceptors) → API calls
                                                              SocketTransport (через ITokenProvider)
```

- `AuthJwtService` — парсинг/валидация JWT, `isExpired(token, bufferSeconds=60)`.
- Request interceptor: `ensureFreshToken()` при скором expiry.
- Response interceptor: 401 → дедуплицированный refresh → ретрай один раз.
- Ошибка refresh → очистка токенов → signOut.
- Результат: `{ data } | { error, isCanceled }`.

### Socket (`shared/lib/socket/`)

- `SocketTransport` — socket.io: `reconnection: true`, `reconnectionAttempts: Infinity`.
- `EmitQueue` — буфер эмитов офлайн.
- Auth token — через `ITokenProvider` (контракт в `shared/lib/socket/contract`).

## Error Handling

- API-вызовы возвращают `{ data } | { error }`, исключений нет.
- `ApiError` (`shared/api/api-error.ts`): `isUnauthorized`, `isForbidden`, `isNotFound`,
  `isServerError`, `isNetworkError`.
- Toast (interceptor): сетевые ошибки и 5xx (key-дедупликация — шторм одинаковых ошибок
  обновляет один тост). 401 — не toast (обрабатывается refresh).

## In-app уведомления (`shared/lib/notifications/`)

- Источник истины — MobX-стор `NotificationStore` (singleton в DI): видимый стек,
  очередь при переполнении (`maxVisible`), таймеры автоскрытия с pause/resume.
- Два контракта на один инстанс (ISP): `INotificationService` — публичный API
  (`show/info/success/warning/error/loading/promise/update/dismiss/dismissAll/configure`),
  `INotificationStore` — внутренний контракт UI-хоста (состояние, pause/resume, finalize).
- Доступ: в компонентах — `useNotifications()`, вне React — `INotificationService.getInstance()`.
- UI — `<NotificationHost />` (observer, монтируется в `App.notifications.tsx`), состояния
  не имеет: уведомления, созданные до монтирования, отрисовываются при появлении хоста.
- Фичи: варианты (info/success/warning/error/loading), позиции top/bottom, title,
  action-кнопка, sticky (`duration: 0`), swipe-to-dismiss, tap-to-dismiss,
  key-дедупликация, `promise()` (loading → success/error поверх одного тоста),
  haptic + accessibility announce, кастомный рендер (`options.render` per-toast или
  `renderContent` хоста).

## Конфигурация чата

Три группы настроек, дублей нет:

| Куда | Что |
|---|---|
| **пропы** | данные, состояние сессии, контекст показа, коллбэки |
| **`features`** | флаги и пороги поведения |
| **`layout`** | числовые метрики чата и панели ввода |

`features` и `layout` — стабильные ссылки (константа или `useMemo`).

`JsChatView` использует штатные механизмы `@legendapp/list` v3.3: `sharedValues`,
`stickyHeaderIndices`, `viewabilityConfigCallbackPairs`, `maintainVisibleContentPosition`,
`maintainScrollAtEnd`, `onStartReached`/`onEndReached`. Ручные JS-аналоги не допускаются.
Детали: `project_native.md`.

## Naming Conventions

Слайсы/сегменты — kebab-case. Имя файла — purpose, не essence.

| Сущность | Паттерн | Пример |
|---|---|---|
| Папка | `kebab-case/` | `sign-in/`, `model/` |
| Компонент (`.tsx`) | `PascalCase.tsx` | `MessageBubble.tsx` |
| Стор/сервис (`.ts`) | `kebab-case.ts` | `store.ts`, `token-provider.ts` |
| Типы (один на сегмент) | `types.ts` | `entities/auth/model/types.ts` |
| Хук (единственный экспорт) | имя файла = имя хука | `useSignInVM.ts` |
| Хук (утилитарный) | `use-kebab-case.ts` | `use-keyboard-inset.ts` |
| Валидация (zod) | `validation.ts` | `features/sign-in/model/validation.ts` |
| Контракт в `shared` | `<name>.contract.ts` | `token-source.contract.ts` |
| DI-модуль | `<slice>.module.ts` | `auth.module.ts` |
| Barrel | `index.ts` | `index.ts` |

Проверяется `eslint-plugin-check-file` ([eslint.naming.mjs](template/eslint.naming.mjs)).

Особые случаи (вне общей конвенции):
- `NativeChatViewSpec`/`NativeInputBarSpec`/`NativeContextMenuViewSpec` — RN codegen-спеки.
- `app/App.*` — композиционный неймспейс.
- `ImageItem.ios.tsx/.android.tsx/.d.ts` — платформенный компонент.
- `shared/{api,config,lib}` — kebab-case, без camelCase-исключения.

## ESLint

| Правило | Назначение |
|---|---|
| `boundaries/dependencies` | Границы слоёв/слайсов FSD |
| `no-restricted-imports` | Self-imports через alias |
| `check-file/filename-naming-convention` | Именование файлов |
| `check-file/folder-naming-convention` | kebab-case папок |
| `simple-import-sort/imports` + `/exports` | Порядок импортов |
| `react-hooks/rules-of-hooks` | Правила хуков |
| `react-hooks/exhaustive-deps` | Зависимости хуков |
| `padding-line-between-statements` | Пустые строки между блоками |
