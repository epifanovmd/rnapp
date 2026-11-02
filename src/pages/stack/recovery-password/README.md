---
module: pages/stack/recovery-password
summary: Экран запроса ссылки для сброса пароля — AuthLayout и форма восстановления.
---

# recovery-password

Экран запроса письма со ссылкой для сброса пароля. Экран `RecoveryPassword` корневого
стека, группа `Public` (`if: useIsSignedOut`), без шапки (`NO_HEADER`); параметров нет.
Deep link — `recoverypassword`.

## Public API

| Экспорт            | Что              |
| ------------------ | ---------------- |
| `RecoveryPassword` | Компонент экрана |

## Устройство

- `AuthLayout` + `RecoveryPasswordForm`; колбэк `onBack` ведёт на `SignIn`.
- Состояние «письмо отправлено» показывает сама форма; автоперехода нет.

## Зависимости

- `@widgets/auth-layout`, `@features/recovery-password`.
- `@shared/lib/navigation` (`useNavigation`).

## Gotcha

- Экрана установки нового пароля по токену из письма в приложении нет — только запрос
  ссылки.
