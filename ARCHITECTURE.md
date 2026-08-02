---
name: Architecture
description: Feature-Sliced Design — структура src/, правила зависимостей, naming, DI, state, HTTP/auth, socket, ESLint
type: project
---

# Architecture Guide

Адаптировано из ARCHITECTURE.md проекта `react-vite` под этот проект (React Native вместо Web).

## Feature-Sliced Design

Проект построен по методологии **Feature-Sliced Design**. Шесть слоёв, каждый следующий строится
поверх предыдущих и не знает о вышестоящих:

```
app → pages → widgets → features → entities → shared
```

```
template/src/
  app/                    ← композиционный корень
    App.tsx               ←   точка входа: DI + провайдеры (Theme, SafeArea, BottomSheet, Keyboard, Dialog.Host, ContextMenuView.Host)
    App.navigator.tsx     ←   выбор маршрутов по IAuthStore.isAuthenticated
    App.screens.ts        ←   манифесты PUBLIC_SCREENS / PRIVATE_SCREENS
    app-tab-screens.tsx   ←   TAB_SCREENS (Main/Playground/Settings)
    App.linking.ts        ←   deep linking
    app.module.ts         ←   регистрация всех *.module.ts (DI)
    app-data-*, common/, hooks/

  pages/                  ← экраны — тонкая композиция widgets/features/entities под роут
    sign-in/, sign-up/, recovery-password/, chat/, settings/
    ui-kit-demo/          ←   демо/плейграунд (stack/ + tabs/)

  widgets/                ← крупные самостоятельные блоки UI
    chat-room/            ←   ChatRoom + useChatRoomMock (мок-данные)
    app-shell/            ←   TabBar

  features/               ← юзкейсы — интерактивные сценарии поверх entities
    sign-in/, sign-up/, recovery-password/   ← model/use<Xxx>VM.ts + validation.ts
    biometric/            ←   useBiometric (общий для sign-in и settings)

  entities/               ← бизнес-сущности — состояние и доменные модели, без UI-форм
    auth/                 ←   model/ (AuthStore, validation, biometric, passkey), api/ (jwt, session, token)
    user/                 ←   model/ (store, session, realtime), lib/permissions

  shared/                 ← переиспользуемый код без знания о бизнес-логике
    ui/                   ←   UI-кит (chat-view, input-bar, context-menu-view, ...)
    api/                  ←   HttpClient, ApiError, contract/, orval codegen (gen/)
    config/               ←   env.ts (react-native-config)
    lib/                  ←   di, holders, navigation, theme, socket, storage, notifications, ...
```

Каждый слайс (`entities/auth`, `features/sign-in`, `widgets/chat-room`, `pages/profile`, ...) —
самодостаточная папка с сегментами `model/`, `api/`, `ui/`, `lib/` внутри. У `shared` слайсов нет —
там сегменты (`ui/`, `api/`, `config/`, `lib/`) сами по себе плоская коллекция независимых модулей.

## Правила зависимостей

```
        ┌────────────┐
        │    app     │  видит всё
        └─────┬──────┘
              │
        ┌─────▼──────┐
        │   pages    │  shared + entities + features + widgets
        └─────┬──────┘
              │
        ┌─────▼──────┐
        │  widgets   │  shared + entities + features
        └─────┬──────┘
              │
        ┌─────▼──────┐
        │  features  │  shared + entities
        └─────┬──────┘
              │
        ┌─────▼──────┐
        │  entities  │  shared
        └─────┬──────┘
              │
        ┌─────▼──────┐
        │   shared   │  ничего бизнесового
        └────────────┘
```

Правило FSD: *модуль слайса может импортировать только слайсы строго нижних слоёв*. Всё проверяется
`eslint-plugin-boundaries` ([eslint.boundaries.mjs](template/eslint.boundaries.mjs)),
`default: "disallow"` — 0 нарушений обязательное условие для мержа.

### Слайсы одного слоя не видят друг друга

`entities/auth` не импортирует `entities/user`, `features/sign-in` не импортирует `features/sign-up`,
`widgets/chat-room` не импортирует `widgets/app-shell`, `pages/sign-in` не импортирует `pages/settings`.

Если двум слайсам одного слоя нужна общая логика — она лежит слоем ниже. Пример:
`loginValidation`/`passwordValidation` используются в `features/sign-in` и `features/sign-up`,
определены в `entities/auth/model/validation.ts`.

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

| Нарушение | Почему |
|---|---|
| **Слайс → слайс того же слоя** | `entities/auth` → `entities/user` ✗ (используй Dependency Inversion — контракт в `shared`) |
| **Слой → слой выше** | `entities/*` → `@features/*` ✗ |
| **Self-import через свой же alias** | внутри `entities/auth/model/` — `@entities/auth` ✗, только относительные пути |

### Self-imports

Внутри слайса/сегмента — только **относительные** пути. Публичный alias самого себя запрещён
(`no-restricted-imports` в [eslint.config.mjs](template/eslint.config.mjs)):
`SHARED_SEGMENTS = ["ui", "api", "config"]`, `SLICE_LAYERS` — конкретные слайсы
(entities: auth/user; features: sign-in/sign-up/recovery-password/biometric; widgets: chat-room/app-shell;
pages: sign-in/sign-up/recovery-password/chat/settings/ui-kit-demo). `shared/lib` сознательно исключён —
это плоская россыпь независимых тем (di, models, utils, theme, socket, holders, ...), им разрешено
ссылаться друг на друга через alias.

```ts
// ✅ Правильно (внутри entities/auth/api/session-guard.ts)
import { IAuthStore } from "../model/types";

// ❌ Неправильно (та же папка)
import { IAuthStore } from "@entities/auth";

// ✅ Правильно (из features/sign-in в entities/auth)
import { IAuthStore } from "@entities/auth";
```

### Контракты (Dependency Inversion)

Если `shared/lib` требует данные из `entities` — создаётся контракт (интерфейс) внутри `shared`, а
`entities` его реализует. Пример:

```
shared/api/contract/token-source.contract.ts   ← интерфейс ITokenSource (ensureFreshToken, refreshToken)
                                                      ↑ implements
entities/auth/api/token-source.ts              ← реальная реализация (SessionService)
```

## Navigation (React Navigation 7)

Экраны — **plain-манифесты**, не файловый роутинг:
- `app/App.screens.ts` — `PUBLIC_SCREENS` (SignIn/SignUp/RecoveryPassword) и `PRIVATE_SCREENS`
  (`MAIN` = табы + демо-стек Components/Carousel/Chat/Charts/ContextMenu/PdfView/WebView).
- `app/app-tab-screens.tsx` — `TAB_SCREENS` (Main/Playground/Settings), рендерятся внутри `MAIN`.
- `app/App.navigator.tsx` — по `IAuthStore.isAuthenticated`: unauth → PUBLIC, auth → `PRIVATE+PUBLIC`.
- `NavigationService` (IoC-синглтон) — императивная навигация вне React
  (`navigateTo`/`pushTo`/`replaceTo`/`goBack`, история).
- Deep linking — `app/App.linking.ts` (схема из `DEEPLINK_BASE_URL`).

## State Management

### Сторы (MobX)

```
entities/auth/
  model/
    store.ts        ← класс MobX store (AuthStore)
    types.ts        ← AuthStatus, IAuthStore (DI-токен)
  auth.module.ts    ← bind(IAuthStore.Tid).to(AuthStore).inSingletonScope()
```

- Стор — **только состояние и переходы**; инфраструктура (токены, refresh) — в `api/`.
- Регистрация — явная через `ContainerModule` в `<slice>.module.ts`.
- Зависимости — через DI: `@IAuthSessionService() private _session: IAuthSessionService`.

### Холдеры (async state) + React-хуки

`shared/lib/holders/` — самодостаточные папки: `entity/`, `collection/`, `paged/`, `infinite/`,
`mutation/`, `polling/`, `base/` (BaseHolder, CombinedHolder), `cursor/`
(Cursor/CachedCursor/SyncCursor), `filter/` (Filter/Filters/Value), `hooks/` (use-holder-ref, watch-effect).

| Хук | Holder | Аналог TanStack Query |
|---|---|---|
| `useEntity` | `EntityHolder` | `useQuery` |
| `useCollection` | `CollectionHolder` | `useQuery` (list) |
| `usePaged` | `PagedHolder` | `useQuery` (paginated) |
| `useInfinite` | `InfiniteHolder` | `useInfiniteQuery` |
| `useMutation` | `MutationHolder` | `useMutation` |
| `usePolling` | `PollingHolder` | `useQuery` + refetchInterval |

Фичи: `{data} | {error}` (никогда не кидают), cancellation (stale-ответы игнорируются),
"quiet refresh". `*Provider`/`use*Context` — для шаринга состояния через дерево.

## DI (Dependency Injection)

- Контейнер: **Inversify**, регистрация — явная через `ContainerModule`.
- Токен/фабрика: `createInjectDecorator<T>()` из `shared/lib/di/` — объект-декоратор с `.Tid`,
  `.getInstance()`, `.useInstance()`.
- Каждый слайс с биндингами — свой `<slice>.module.ts`; все модули собираются в
  `app/app.module.ts` (`registerContainerModules`), вызывается в начале `App.tsx`.

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
| В React-компоненте/хуке | `IAuthJwtService.useInstance()` (useRef-мемоизация) |
| Вне React (сервис, стор) | `IAuthJwtService.getInstance()` |
| Инъекция в конструктор | `@IAuthJwtService() private _jwt: IAuthJwtService` |

Отдельных wrapper-хуков нет — компоненты вызывают `IXxx.useInstance()` напрямую.

## HTTP и Авторизация

### Token lifecycle

```
TokenStorage → SessionService (ensureFreshToken, refresh) → HttpClient (interceptors) → API calls
                                                              SocketTransport (via ITokenProvider)
```

### JWT
- `AuthJwtService` (`entities/auth/api/jwt-service.ts`) — парсинг/валидация токена,
  `isExpired(token, bufferSeconds = 60)`.
- `isTokenExpiringSoon(bufferSeconds = 60)` (`session-service`) — проактивный refresh за 60s до expiry.

### 401 handling
- **Request interceptor**: `ensureFreshToken()` — проактивный refresh при скором expiry.
- **Response interceptor**: 401 → `_handleConcurrentRefresh()` (дедуплицированный refresh) → ретрай
  запроса один раз.
- Ошибка refresh → очистка токенов/session → signOut.
- Результат нормализуется: `{ data } | { error, isCanceled }`.

### Socket transport (`shared/lib/socket/`)
- `SocketTransport` — socket.io: `reconnection: true`, `reconnectionAttempts: Infinity`, jitter 0.3.
- `EmitQueue` — буфер эмитов офлайн, `PersistentListeners` — переживают reconnect.
- Auth token — через `ITokenProvider` (контракт в `shared/lib/socket/contract`, реализация в
  `entities/auth`). `UserSocketService` — user-scoped realtime-события.

## Error Handling

- Все API-вызовы возвращают `{ data } | { error }`, исключения не кидаются.
- `ApiError` (`shared/api/api-error.ts`): `isUnauthorized`, `isForbidden`, `isNotFound`,
  `isServerError`, `isNetworkError`.
- Toast (interceptor): сетевые ошибки («Нет соединения с сервером», 6s) и 5xx.
  401 — НЕ toast, обрабатывается refresh/reconnect.

## Native modules (кратко)

ChatView, InputBar, ContextMenu — **тонкие iOS-бриджи**; реальный UI — во внешнем поде `IOSChatView`
(sibling repo, `ios/Podfile`). **Нет Android-native** чата/инпута/меню — на Android/non-iOS используются
JS-порты (`JsChatView`/`JsInputBar`/`JsContextMenuView`). **Picker/WheelPicker** — на обеих платформах.
Fabric-спеки: `NativeChatViewSpec`/`NativeInputBarSpec`/`NativeContextMenuViewSpec` (framework-имена).

`JsChatView` опирается на штатные механизмы `@legendapp/list` v3.3: `sharedValues` (позиция скролла и
признаки края — читаются в ворклетах), `stickyHeaderIndices` (плавающая дата), `viewabilityConfigCallbackPairs`
(видимость и прочитанность), `maintainVisibleContentPosition` / `maintainScrollAtEnd` (позиция),
`onStartReached`/`onEndReached` (пагинация). Ручных аналогов на JS быть не должно.
Подробности и JS-архитектура чата — в `project_native.md`.

## Naming Conventions

Слайсы и сегменты — всегда **kebab-case**. Имя файла описывает **purpose, не essence** — слайс уже
сказал, о чём он, повторять в имени не нужно (`entities/user/model/store.ts`, а не `User.store.ts`).

| Сущность | Паттерн | Пример |
|---|---|---|
| Слайс/сегмент (папка) | `kebab-case/` | `sign-in/`, `chat-room/`, `model/`, `api/` |
| Компонент (`.tsx`) | `PascalCase.tsx` | `MessageBubble.tsx`, `ChatAvatar.tsx` |
| Стор/сервис (`.ts`) | `kebab-case.ts` | `store.ts`, `token-provider.ts` |
| Типы слайса/сегмента (единственный файл) | `types.ts` | `entities/auth/model/types.ts` |
| React-хук — единственный смысловой экспорт | имя файла = имя хука (camelCase) | `useSignInVM.ts`, `useBiometric.ts` |
| React-хук — утилитарный, среди файлов модуля | `use-kebab-case.ts` | `use-holder-ref.ts`, `use-keyboard-inset.ts` |
| Валидация (zod) | `validation.ts` | `features/sign-in/model/validation.ts` |
| Контракт (интерфейс в `shared`) | `<name>.contract.ts` | `token-source.contract.ts` |
| Модуль DI-регистрации | `<slice>.module.ts` | `auth.module.ts` |
| Barrel (Public API) | `index.ts` | `index.ts` |

Проверяется `eslint-plugin-check-file` ([eslint.naming.mjs](template/eslint.naming.mjs)):
kebab-case папок, PascalCase компонентов, camelCase VM-хуков. **Особые случаи** (не наша конвенция,
не подчиняются общей проверке):
- RN codegen-спеки: `NativeChatViewSpec`, `NativeInputBarSpec`, `NativeContextMenuViewSpec`.
- `app/App.*` — композиционный неймспейс (App.tsx, App.navigator.tsx, App.screens.ts, ...);
  `app/app-tab-screens.tsx` — JSX-модуль, не компонент.
- `ImageItem.ios.tsx/.android.tsx/.d.ts` — платформенный компонент, `.d.ts` совпадает по имени.
- `shared/{api,config,lib}` — kebab-case без глагольного camelCase-исключения (хуки уже kebab-case).

## ESLint

| Правило | Назначение |
|---|---|
| `boundaries/dependencies` | Границы слоёв/слайсов FSD (`eslint.boundaries.mjs`) |
| `no-restricted-imports` | Self-imports внутри слайса/сегмента через свой же alias |
| `check-file/filename-naming-convention` | Именование файлов (`eslint.naming.mjs`) |
| `check-file/folder-naming-convention` | kebab-case папок |
| `simple-import-sort/imports` + `/exports` | Порядок импортов |
| `react-hooks/rules-of-hooks` | Правила хуков |
| `react-hooks/exhaustive-deps` | Полнота зависимостей |
| `padding-line-between-statements` | Пустые строки между блоками |
