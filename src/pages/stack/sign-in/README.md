---
module: pages/stack/sign-in
summary: Экран входа — тонкая композиция AuthLayout и формы входа с биометрией в слоте альтернатив.
---

# sign-in

Экран входа неавторизованного пользователя. Экран `SignIn` корневого стека, группа
`Public` (`if: useIsSignedOut`), без шапки (`NO_HEADER`); параметров нет. Deep link —
`signin`, алиас `SignIn`.

## Public API

| Экспорт  | Что              |
| -------- | ---------------- |
| `SignIn` | Компонент экрана |

## Устройство

- `AuthLayout` + `SignInForm`. Переходы «Забыли пароль?» и «Регистрация» —
  `navigation.navigate` на `RecoveryPassword` / `SignUp` через колбэки формы.
- `BiometricSignInButton` передаётся в слот `alternatives` формы — страница связывает две
  фичи, фичи друг друга не импортируют.
- После успешного входа навигация не вызывается: guard-группы стека сами переключают
  набор экранов.

## Зависимости

- `@widgets/auth-layout`, `@features/sign-in`, `@features/biometric`.
- `@shared/lib/navigation` (`useNavigation`).

## Gotcha

- Алиас `SignIn` в linking (`SIGN_IN_LINKING` в `App.screens.ts`) — зарегистрированный
  `redirect_uri` GitHub OAuth, его нельзя убирать при правке путей.
