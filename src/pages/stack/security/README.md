---
module: pages/stack/security
summary: «Безопасность» — email, username, пароль, 2FA, сессии, выход везде и удаление аккаунта.
---

# security

Экран «Безопасность»: настройки учётной записи. Экран `Security` корневого стека,
группа `Private`, заголовок из `options.title`; параметров нет. Deep link — `security`.
Открывается из меню вкладки Settings.

## Public API

| Экспорт    | Что                           |
| ---------- | ----------------------------- |
| `Security` | Компонент экрана (`observer`) |

## Устройство

- Страница — композиция секций в `KeyboardAwareScrollView`: формы `ChangeEmailForm`,
  `UsernameForm`, `ChangePasswordForm`, `TwoFactorForm`, `DeleteAccountForm`
  (`features/account-security`), `SignOutAllButton` (`features/sign-out`) и своя
  `SessionsSection`.
- `SessionsSection` — `ISessionStore`: `load()` при монтировании, ошибка с «Повторить»,
  строка сессии через `SessionModel` (устройство, IP · последняя активность). Текущая
  сессия (`IAuthSessionGuard.isCurrentSession`) помечена «Это устройство» и не
  завершается; остальные — `terminateSession`, все остальные разом —
  `terminateOtherSessions` с `notifyApiError`.

## Зависимости

- `@features/account-security`, `@features/sign-out`.
- `@entities/user` — `ISessionStore`, `SessionModel`.
- `@shared/lib/contracts` (`IAuthSessionGuard`), `@shared/lib/http` (`notifyApiError`),
  `@shared/lib/notifications`, `@shared/ui`.

## Gotcha

- `KeyboardAwareScrollView` импортирован напрямую из `react-native-keyboard-controller`,
  а не из `@shared/ui` — поведение клавиатуры здесь отличается от остальных экранов.
