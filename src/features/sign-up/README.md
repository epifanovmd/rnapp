---
module: features/sign-up
summary: Регистрация по email или телефону с необязательными именем и фамилией.
---

# sign-up

Форма регистрации: имя и фамилия (необязательно), логин, пароль с подтверждением.

## Public API

| Экспорт      | Что                                              |
| ------------ | ------------------------------------------------ |
| `SignUpForm` | observer-форма; проп `onSignIn` (ссылка «Войти») |

## Устройство

- `model/useSignUpVM.ts` — `handleSignUp`: `toSignUpRequest(data)` → `IAuthStore.signUp`;
  ошибка сервера — тостом через `notifyApiError`.
- `model/sign-up-request.ts` — чистый `toSignUpRequest`: логин уходит полем `email` или `phone`,
  пустые имена (после trim) не отправляются, логин не email и не телефон — `null` (запроса нет).
  Тест — `model/__tests__/sign-up-request.test.ts`.
- `model/validation.ts` — имя/фамилия до 40 символов, `loginValidation`/`passwordValidation` из
  `@entities/auth`, совпадение паролей (`refine` на `confirmPassword`).

## Зависимости

- `@entities/auth`, `@shared/lib/{http,notifications,utils}`, `@shared/ui`.
- Используется: `pages/stack/sign-up`.

## Gotcha

- Успешная регистрация сразу авторизует (`setTokens`) — стек переключается без навигации из
  фичи.
