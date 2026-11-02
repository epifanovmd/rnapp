---
module: entities/auth
summary: Аутентификация — статус входа, вход/регистрация/2FA/restore/выход, guard текущей сессии и общие валидации логина и пароля.
---

# auth

Только домен аутентификации. Токены и их обновление — инфраструктура бэкенда (`IMainSession` в
`@shared/api`), профиль и права — [entities/user](../user/README.md).

## Public API

| Экспорт                                 | Что                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| `IAuthStore`, `AuthStatus`              | стор аутентификации; статус Idle / Loading / Authenticated / Unauthenticated |
| `loginValidation`, `passwordValidation` | общие zod-правила форм: email или телефон; пароль от 6 символов              |
| `authModule`                            | DI: `IAuthSessionGuard` и `IAuthStore`                                       |

## Устройство

```
model/store.ts        AuthStore: статус, 2FA, вызовы auth-эндпоинтов
model/types.ts        AuthStatus, IAuthStore
model/validation.ts   loginValidation, passwordValidation
api/session-guard.ts  AuthSessionGuard — реализация IAuthSessionGuard (@shared/lib/contracts)
```

- `signIn`/`verify2FA`/`signUp` возвращают `ApiError | null` — ошибку показывает вызывающий
  (`notifyApiError`). Ответ `require2FA === true` → `twoFactorToken`/`twoFactorHint`, статус
  `Unauthenticated`, `isTwoFactorRequired`.
- `restore(tokens?)`: с токенами (вход по биометрии) — `setTokens`, без — `restoreSession()` из
  хранилища.
- `logout()` — кнопка «Выйти»: `api.signOut({ notifyErrors: false })`, затем локальный
  `signOut()`. `signOut()` — только локально (истёкшая сессия, guard, удаление аккаунта).
  `signOutAll()` выходит локально только при успехе сервера.
- Подписки на сессию: `onSessionExpired` → `signOut()`; `onTokenChange` с непустым токеном при
  `Unauthenticated` без 2FA → `Authenticated` (повтор refresh после временной ошибки).
- `enable2FA`/`disable2FA` — проброс в API, статус не меняют.
- `AuthSessionGuard` (`isCurrentSession(sessionId)` по `session.sessionId`, `signOut()`)
  инжектится в `entities/user` через контракт — соседние слайсы не импортируют друг друга.
- Тесты — `model/__tests__/auth-store.test.ts`, `api/__tests__/session-guard.test.ts`.

## Зависимости

- `@shared/api` (`IMainApi`, `IMainSession`), `@shared/lib/{session,contracts,models,di,http}`.
- Используется: `app` (DI, бутстрап, guard-хуки стека, `AppDataStore`), `features/sign-in`,
  `sign-up`, `sign-out`, `recovery-password` (валидация), `account-security`, `biometric`.

## Gotcha

- Переход между Public и Private стеком делает навигатор по `isAuthenticated` — стор и фичи не
  навигируют.
- `sessionId` текущей сессии — из ответа бэкенда, JWT не разбирается.
