---
module: features/account-security
summary: Настройки безопасности аккаунта — email, username, пароль, 2FA и удаление аккаунта.
---

# account-security

Формы экрана «Безопасность». Каждая форма — свой VM-хук в `model/`, ошибки сервера — тостом
через `notifyApiError`.

## Public API

| Экспорт              | Что                                                         |
| -------------------- | ----------------------------------------------------------- |
| `ChangeEmailForm`    | подтверждение текущего email и смена адреса кодом из письма |
| `UsernameForm`       | установка username                                          |
| `ChangePasswordForm` | текущий пароль + новый с подтверждением                     |
| `TwoFactorForm`      | включение / выключение второго пароля                       |
| `DeleteAccountForm`  | удаление аккаунта по паролю с подтверждением                |

Все — observer-компоненты без пропсов.

## Устройство

- `useVerifyEmailVM` — для неподтверждённого email: `requestVerifyEmail` → код → `verifyEmail`.
- `useChangeEmailVM` — два шага: `requestEmailChange(email)` (`updateMyUser`) → код с нового
  адреса → `confirmEmailChange`; адрес меняется только после кода.
- `useUsernameVM` — значения формы следуют за `user.username`; регэксп как на сервере
  `^[a-z0-9_]{5,32}$`.
- `useChangePasswordVM` → `IUserStore.changePassword`; остальные сессии сервер завершает.
- `useTwoFactorVM` → `IAuthStore.enable2FA`/`disable2FA`; пустая подсказка не отправляется.
- `useDeleteAccountVM` — нативный `Alert` → `IUserStore.deleteMyAccount(password)` →
  `IAuthStore.signOut()`.
- `model/validation.ts` — схемы всех форм; тест — `model/__tests__/validation.test.ts`.

## Зависимости

- `@entities/user` (`IUserStore`), `@entities/auth` (`IAuthStore`, `passwordValidation`),
  `@shared/lib/{http,notifications}`, `@shared/ui`.
- Используется: `pages/stack/security` (там же список сессий и `SignOutAllButton`).

## Gotcha

- Статуса 2FA в `UserDto` нет — режим «включить / выключить» пользователь выбирает сам.
- Удаление аккаунта подтверждается `Alert.alert`, а не `useConfirm` кита, как в других фичах.
