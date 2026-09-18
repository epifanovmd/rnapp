---
name: Session Layer
description: Общий слой токенов lib/session — хранение, refresh, политики, связь с HTTP и сокетом
type: project
---

## Где что

`shared/lib/session/` — переиспользуемая механика токенов, ничего не знает ни об
HTTP, ни о конкретном бэкенде. Единственная зависимость — тип `IStorageService`.

| Файл                                  | Что                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `session.types.ts`                    | `TokenPair`, `ITokenStorage`, `RefreshHandler`, `RefreshPolicy`, `ITokenSession`, `toTokenPair` |
| `token-session.ts`                    | `TokenSession` — ядро: состояние, дедупликация refresh, подписки                                |
| `refresh-policy.ts`                   | `refreshNever`, `refreshBeforeJwtExpiry(buffer)`, `refreshAlways`                               |
| `jwt.ts`                              | чистые `parseJwt`, `isJwtExpired`, `jwtExpiresIn`                                               |
| `storage/memory-token-storage.ts`     | токены только в памяти                                                                          |
| `storage/persistent-token-storage.ts` | поверх `IStorageService`; по умолчанию хранит только refresh                                    |

## Как конфигурируется

`new TokenSession({ refresh, storage?, shouldRefresh? })`:

- `refresh` — как именно этот бэкенд меняет пару токенов; реджект = сессия
  недействительна, сессия очищается и поднимается `onSessionExpired`;
- `storage` — где пара живёт между запусками (по умолчанию память);
- `shouldRefresh` — обновлять ли заранее (по умолчанию нет, реагируем на 401).

`setTokens` нормализует вход через `toTokenPair`: ответы логина несут ещё и
профиль, в сессию попадают только токены.

## Направление зависимостей

`ITokenSource` — порт в `lib/http`, его владелец `bearerAuth`, это чистый тип
без DI. `ITokenSession` **намеренно не наследует** его: слой сессии не зависит
от транспорта. Совпадение формы проверяется структурно там, где сессию передают
в фабрику клиента, и типом в тесте `token-session.test.ts`.

Граф односторонний: `lib/http` и `lib/session` независимы и тянут только
type-only контракты соседей → `shared/api/*` соединяет их в `api.module.ts`.
Глобального DI-токена «источник токена» нет: каждый бэкенд передаёт свою сессию
в фабрику клиента явно.

## Использование

Сессия — инфраструктура бэкенда, поэтому лежит рядом с его API, а не в домене:

- `shared/api/main/main-session.ts` — `PersistentTokenStorage` по ключу
  `app:refresh_token` плюс `refreshBeforeJwtExpiry(60)`;
- `shared/api/dummyjson/dummyjson-session.ts` — `DummyJsonSession extends
TokenSession`: память, реактивная стратегия, сверху только `login`.

`entities/auth` — только домен: статус, 2FA, guard; он потребляет `IMainSession`.
Сокетный `ITokenProvider` связан с сессией основного бэкенда в `api.module.ts`
через `toService`. Покрыто `shared/api/__tests__/api-module-wiring.test.ts`.

Логин и refresh всегда ходят по отдельному HTTP-клиенту без `bearerAuth`,
иначе 401 от самого refresh ушёл бы в рекурсию.

## Тесты DI

`babel-jest.config.js` включает те же плагины декораторов, что и приложение,
иначе контейнер не соберёт классы с `@inject`. Нативные модули подменены
в `jest/stubs/`: `react-native`, `react-native-mmkv`, `react-native-config`.
DI-модули импортируют контракты напрямую (`notifications/notification.types`),
а не бочки — бочка уведомлений тянет ещё и UI-компоненты.

## Правки хранилища извне

`ITokenStorage.subscribe` — необязательный метод. Если он есть, `TokenSession`
подхватывает токены, записанные снаружи, и обратно в хранилище их не пишет.
Исчезновение токенов трактуется как конец сессии: поднимается
`onSessionExpired`, то есть доменный стор разлогинится. `dispose()` снимает
подписку.
