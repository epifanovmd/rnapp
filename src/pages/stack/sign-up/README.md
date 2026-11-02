---
module: pages/stack/sign-up
summary: Экран регистрации — AuthLayout и форма регистрации со ссылкой на вход.
---

# sign-up

Экран регистрации. Экран `SignUp` корневого стека, группа `Public`
(`if: useIsSignedOut`), без шапки (`NO_HEADER`); параметров нет. Deep link — `signup`.

## Public API

| Экспорт  | Что              |
| -------- | ---------------- |
| `SignUp` | Компонент экрана |

## Устройство

- `AuthLayout` + `SignUpForm`; колбэк `onSignIn` ведёт на `SignIn`.
- После успешной регистрации навигация не вызывается: guard-группы стека сами
  переключают набор экранов.

## Зависимости

- `@widgets/auth-layout`, `@features/sign-up`.
- `@shared/lib/navigation` (`useNavigation`).
