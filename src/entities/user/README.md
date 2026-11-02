---
module: entities/user
summary: Текущий пользователь — профиль, роли и права, приватность, сессии и realtime-синхронизация по сокету.
---

# user

Данные авторизованного пользователя и его сессий. Вход, 2FA и токены — в
[entities/auth](../auth/README.md).

## Public API

| Экспорт                                                                     | Что                                                                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `IUserStore`                                                                | профиль, роли, права (`can`/`scope`/`canOn`/`hasRole`), приватность, операции аккаунта |
| `ISessionStore`                                                             | список сессий (`CollectionHolder`), завершение одной / остальных                       |
| `IUserRealtime`                                                             | `SupportInitialize`: сокет-события пользователя на время сессии                        |
| `Permission`, `AccessScope`, `ALL_PERMISSIONS`                              | право-строка, область `all`/`own`, полный доступ `*`                                   |
| `UserModel`, `ProfileModel`, `PublicUserModel`, `RoleModel`, `SessionModel` | view-модели DTO                                                                        |
| `userModule`                                                                | DI: сокет-сервис, сторы, realtime                                                      |

## Устройство

- `model/store.ts` — `UserStore` на `EntityHolder` (`getMyUser`) и отдельном `privacyHolder`.
  `load()` при уже загруженных данных обновляет тихо. Мутации (`updateProfile`, `setUsername`,
  `confirmEmailChange`, `verifyEmail`, `updatePrivacy`) кладут ответ в холдер; ошибку
  показывает потребитель. `deleteMyAccount` при успехе делает `reset()`, выход — за вызывающим.
- `lib/permissions.ts`: `домен:действие`, wildcard `домен:*`, `*`; роль `admin` — полный доступ.
  Право `x:delete` покрывает `x:delete:own`. `scope(право)` → `all | own | null`,
  `canOn(право, owners)` — `all` или `own` и пользователь среди `owners`.
- `model/session-store.ts` — `handleSessionTerminated`: убирает сессию; если это текущая
  (`IAuthSessionGuard.isCurrentSession`) или `"all"` (аккаунт удалён) — `guard.signOut()`.
- `api/user-socket.ts` — `UserSocketService.subscribe(handlers)`: события `profile:*`, `user:*`,
  `session:*`; `profile:subscribe` шлётся на каждом подключении; `onReconnect` — только после
  переподключения, не первого подключения.
- `model/realtime.ts` — мост событий в сторы: `user:privileges-changed`, свой
  `profile:updated` и переподключение → `refresh()`; username/email/приватность — точечный
  patch; `session:new`/`terminated` → `ISessionStore`.
- Тесты — `lib/__tests__/permissions.test.ts`, `model/__tests__/*`.

## Зависимости

- `@shared/api` (`IMainApi`), `@shared/lib/{holders,models,socket,contracts,di,http}`.
- Используется: `app` (DI, `AppDataStore`), `widgets/app-menu`, `features/account-security`,
  `biometric`, `edit-profile`, `profile-settings`, `pages/stack/{profile,security,files}`.

## Gotcha

- `IAuthStore` не импортируется: выход при завершении сессии — через контракт
  `IAuthSessionGuard` из `@shared/lib/contracts`, реализованный в `entities/auth`.
- `profile:updated` несёт публичный профиль (`avatarUrl`, не `avatar`) — свой профиль
  перечитывается целиком, а не патчится.
- Смена прав не разлогинивает: сокет-событие вызывает `refresh()`, права пересчитываются.
- Права — строки из ответа сервера, перечня известных прав в спеке нет.
