---
module: features/sign-out
summary: Выход из аккаунта с подтверждением и выход на всех устройствах.
---

# sign-out

Две кнопки выхода: из текущей сессии и завершение всех сессий пользователя на сервере.

## Public API

| Экспорт            | Что                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `SignOutButton`    | «Выйти» с подтверждением; пропсы `IButtonProps` без `onPress`/`title`/`children` (по умолчанию danger, outline, иконка `logOut`) |
| `SignOutAllButton` | «Выйти на всех устройствах», без подтверждения                                                                                   |

## Устройство

- `model/useSignOut.ts` → `IAuthStore.logout()`: серверный `signOut` без тоста ошибки, затем
  локальный выход.
- `model/useSignOutAll.ts` → `IAuthStore.signOutAll()`; локальный выход только при успехе
  сервера, ошибка — `notifyApiError`; флаг загрузки в `useState`.
- Подтверждение — `useConfirm` из `@shared/ui`.

## Зависимости

- `@entities/auth`, `@shared/lib/{http,notifications}`, `@shared/ui`.
- Используется: `widgets/app-menu` (`SignOutButton`), `pages/stack/security` (`SignOutAllButton`).

## Gotcha

- `logout()` выходит локально, даже если сервер не ответил: сессия на сервере может остаться
  до истечения.
