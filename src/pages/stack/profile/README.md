---
module: pages/stack/profile
summary: «Профиль» — аватар, личные данные и контакты, приватность; правка в шторке из навбара.
---

# profile

Экран «Профиль» текущего пользователя. Экран `Profile` корневого стека, группа
`Private`, заголовок из `options.title`; параметров нет. Deep link — `profile`.
Открывается карточкой профиля в меню вкладки Settings.

## Public API

| Экспорт   | Что                           |
| --------- | ----------------------------- |
| `Profile` | Компонент экрана (`observer`) |

## Устройство

- Данные — `IUserStore`: `load()` при монтировании и на pull-to-refresh
  (`ScreenScroll onRefresh`); модель — `userStore.profile`, сырые поля —
  `userStore.user?.profile`. Загрузка/пусто/ошибка — `ScreenState` с повтором.
- Кнопка `edit` в `headerRight` (через `navigation.setOptions`, только когда модель есть)
  открывает `EditProfileModal`; состояние открытия — локальный `useState`.
- Секции: «Аватар» (`AvatarPicker`), «Личные данные» (нажатие на строку открывает
  правку), «Контакты» (email, статус email `Tag`, телефон, роль), «Приватность»
  (`PrivacySettingsForm`), дата регистрации.
- `ProfileDetails` — заголовок + `SettingsGroup` строк `ValueRow`; пустое значение —
  прочерк.

## Зависимости

- `@entities/user` — `IUserStore`.
- `@features/edit-profile` — `EditProfileModal`; `@features/profile-settings` —
  `AvatarPicker`, `PrivacySettingsForm`.
- `@shared/ui`, `@shared/lib/navigation` (`useNavigation`).

## Gotcha

- Экран сам перечитывает пользователя при открытии: после сбоя сети или hot reload
  стор может быть пуст; при наличии данных загрузка «тихая».
