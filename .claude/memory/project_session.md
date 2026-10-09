---
name: Session Layer
description: Общий слой токенов lib/session — хранение, refresh, политики, связь с HTTP и сокетом
type: project
---

## Где что

`shared/lib/session/` — переиспользуемая механика токенов, ничего не знает ни об
HTTP, ни о конкретном бэкенде. Единственная зависимость — тип `IStorageService`.

| Файл                                  | Что                                                                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `session.types.ts`                    | `TokenGrant` (ответ бэкенда), `TokenPair` (+`expiresAt`/`refreshAt`/`sessionId`), `ITokenStorage`, `ITokenSession`, `toTokenPair` |
| `token-session.ts`                    | `TokenSession` — ядро: состояние, дедупликация, таймер тихого обновления, подписки                                                |
| `storage/memory-token-storage.ts`     | токены только в памяти                                                                                                            |
| `storage/persistent-token-storage.ts` | поверх `IStorageService`; по умолчанию хранит только refresh                                                                      |

В `token-session.ts` есть браузерные ветки (`document`/`visibilitychange`, `navigator.locks`):
в RN их нет, ветки просто не срабатывают.

## Как конфигурируется

`new TokenSession({ refresh, storage?, refreshBufferSeconds?, autoRefresh?, lockName?, isSessionRejected? })`:

- `refresh` — как бэкенд меняет пару; возвращает `TokenGrant` (`accessToken`,
  `refreshToken`, `expiresIn?`, `sessionId?`);
- срок — из `expiresIn` ответа по часам клиента на получении (JWT **не разбирается**,
  `jwt.ts`/`refresh-policy.ts` удалены 2026-09-28). Без `expiresIn` (DummyJSON) —
  только реакция на 401;
- `refreshBufferSeconds` (60, не больше половины срока), `autoRefresh` (true) — таймер;
  после фона просроченный таймер срабатывает при возврате, плюс `ensureFreshToken`
  перед каждым запросом (`bearerAuth`) и handshake сокета;
- `isSessionRejected(error)` — конец сессии (clear + `onSessionExpired`); иначе ошибка
  временная: токены остаются, повтор через 10 с. Основной бэкенд: только HTTP 4xx кроме 429.

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
  `app:refresh_token`, `refreshBufferSeconds: 60`, `isSessionRejected`;
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

## Смена прав и завершение сессий (сервер)

- Смена прав не разлогинивает: старые access-токены получают 401
  `AUTH_PRIVILEGES_CHANGED`, `bearerAuth` обновляет токен и повторяет запрос;
  `user:privileges-changed` → `userStore.refresh()`.
- `session:terminated { sessionId: "all" }` (аккаунт удалён) → выход
  (`SessionStore.handleSessionTerminated`).
- Выход сбрасывает `userStore` (и файлы, задачи, журнал) в `AppDataStore`.
- Права — строки (`Permission` в entities/user), `KnownPermission` в спеке нет;
  демо-задача — по праву `jobs:demo` (`JOB_PERMISSIONS`).
- Область права «все / свои»: `x:delete` покрывает `x:delete:own`. `IUserStore.scope(право)` →
  `all | own | null`, `canOn(право, [ownerId])` — можно ли действие над сущностью. Файлы
  (`FILE_PERMISSIONS`): переключатель «Мои / Все» — только при `scope("file:view") === "all"`,
  кнопка удаления — по `canOn("file:delete", [ownerId])`.
- «Мой журнал» живой: `audit:created` → `IAuditRealtime` → `AuditStore.prepend`.

## Вход по биометрии (`features/biometric`)

- Состояние — `IBiometricStore` (MobX, DI-модуль фичи `biometricModule`, грузится в `app/app.module.ts`):
  один источник для `BiometricMenuItem`, `BiometricSignInButton` и бутстрапа. Нативка — за портом
  `IBiometricDevice` (`NativeBiometricDevice`: react-native-biometrics + device-info + AsyncStorage
  для миграции), поэтому стор покрыт тестом на фейках (`model/__tests__/biometric-store.test.ts`).
- Регистрация — MMKV `app:biometric` = `{ userId, deviceId }`; прежний AsyncStorage `biometricUserId`
  переносится в `load()` (deviceId — `getUniqueId`) и удаляется.
- `isEnabled` = регистрация того же `user.id`; `canSignIn` = датчик + регистрация (любого пользователя).
  Выход из аккаунта ключ не трогает; включение другим пользователем заменяет ключ (запись прежнего
  на сервере остаётся до его отзыва).
- Вход: датчик → ключ есть? → nonce (`auth:false`) → `createSignature` → verify (`auth:false`) →
  `authStore.restore(tokens)`. Один вход за раз (`isBusy`). 2FA и lockout сервер не проверяет.
- Разбор ошибок — чистые `model/biometric-outcome.ts`: 401 verify в срок nonce (5 мин − 10 с) —
  ключ отозван → сброс; позже — «время истекло», без сброса; 429/4xx — текст сервера; сеть/5xx — тихо
  (тост уже от notifyErrors). Нативные: отмена — тихо (авто/включение) или info; `Key not found` /
  `invalidated` — сброс; lockout — «Датчик заблокирован…».
- Выключение — `DELETE /biometric/{deviceId}` (404 = успех) + удаление ключа всегда.
  Сверка `sync()` при показе строки меню: ключа нет → отзыв + сброс; устройства нет в `GET /devices` → сброс.
