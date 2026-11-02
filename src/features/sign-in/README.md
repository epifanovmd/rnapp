---
module: features/sign-in
summary: Вход по логину и паролю, подтверждение вторым паролем (2FA) и переход к GitHub OAuth.
---

# sign-in

Форма входа: email/телефон и пароль, при включённой 2FA — второй пароль, кнопка GitHub OAuth и
слот под другие способы входа.

## Public API

| Экспорт      | Что                                                                    |
| ------------ | ---------------------------------------------------------------------- |
| `SignInForm` | observer-форма; пропсы `onForgotPassword`, `onSignUp`, `alternatives?` |

## Устройство

- `model/useSignInVM.ts`:
  - `handleLogin` → `IAuthStore.signIn(data)`, `handleVerify2FA` → `IAuthStore.verify2FA`;
    ошибка — тостом через `notifyApiError`;
  - `loginByGithub` открывает `github.com/login/oauth/authorize` (`GITHUB_CLIENT_ID`,
    `GITHUB_REDIRECT_URI`, scope `user:email`) через `Linking.openURL`.
- `ui/SignInForm.tsx`: при `isTwoFactorRequired` вместо «Войти» — `TwoFactorPrompt` (подсказка
  `twoFactorHint`), блок «или» с `alternatives` и GitHub скрыт.
- `ui/TwoFactorPrompt.tsx` — второй пароль в локальном `useState`, не в форме.
- `model/validation.ts` — `loginValidation`, `passwordValidation` из `@entities/auth`.
- Тест — `model/__tests__/useSignInVM.test.ts`.

## Зависимости

- `@entities/auth` (`IAuthStore`, валидации), `@shared/config/env`, `@shared/lib/{http,notifications}`,
  `@shared/ui`.
- Используется: `pages/stack/sign-in` (в `alternatives` — `BiometricSignInButton` из
  `features/biometric`: фича не импортирует фичу).

## Gotcha

- После успешного входа навигации нет: стек переключает guard-группа по `isAuthenticated`.
- Ответ GitHub OAuth (код на redirect_uri) в клиенте не обрабатывается: deep link лишь открывает
  экран SignIn (alias `SignIn` в `app/App.screens.ts`).
