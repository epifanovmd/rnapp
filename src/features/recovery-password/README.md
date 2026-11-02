---
module: features/recovery-password
summary: Запрос письма для сброса пароля и состояние «письмо отправлено».
---

# recovery-password

Форма запроса ссылки сброса пароля по email или телефону; после успеха форма сменяется
подтверждением с текстом сервера.

## Public API

| Экспорт                | Что                                                |
| ---------------------- | -------------------------------------------------- |
| `RecoveryPasswordForm` | observer-форма; проп `onBack` (вернуться ко входу) |

## Устройство

- `model/useRecoveryPassword.ts` — `IMainApi.requestResetPassword({ login })`; ошибка — тостом,
  успех — `sentMessage` (сообщение сервера или пустая строка) и `isSent`.
- `ui/RecoveryPasswordSuccess.tsx` — «Письмо отправлено»; пустое сообщение — текст по
  умолчанию.
- `model/validation.ts` — `loginValidation` из `@entities/auth`.

## Зависимости

- `@entities/auth` (валидация), `@shared/api` (`IMainApi`), `@shared/lib/{http,notifications,theme}`,
  `@shared/ui`.
- Используется: `pages/stack/recovery-password`.

## Gotcha

- Автоперехода после отправки нет — только кнопка «Вернуться к входу».
- Установки нового пароля по токену из письма в клиенте нет: экрана под `resetPassword` нет.
