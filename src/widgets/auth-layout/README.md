---
module: widgets/auth-layout
summary: Оформление экранов входа, регистрации и восстановления пароля без шапки навигатора.
---

# auth-layout

Общая рамка auth-экранов: логотип, название приложения, карточка под форму и версия сборки.
Форму передаёт страница через `children`.

## Public API

| Экспорт      | Что                                                  |
| ------------ | ---------------------------------------------------- |
| `AuthLayout` | обёртка `PropsWithChildren`; содержимое — в карточку |

## Устройство

- Корень — `KeyboardAwareScrollView` кита: поля формы не уходят под клавиатуру.
- Safe area сверху и снизу добавляется к отступам контента (`24 + inset`), контент центрирован
  по вертикали (`flexGrow: 1`).
- Логотип — иконка `shieldCheck` на `primary`; название и версия — `APP_NAME`/`APP_VERSION` из
  `@shared/config/app-info`.

## Зависимости

- `@shared/ui` (`Col`, `Icon`, `KeyboardAwareScrollView`, `Text`), `@shared/lib/theme`,
  `@shared/config/app-info`, `react-native-safe-area-context`.
- Используется: `pages/stack/{sign-in,sign-up,recovery-password}` (экраны с `headerShown: false`).
