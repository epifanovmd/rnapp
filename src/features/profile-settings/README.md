---
module: features/profile-settings
summary: Аватар профиля (новое фото или одно из своих изображений) и настройки приватности.
---

# profile-settings

Две секции экрана профиля: выбор аватара и уровни приватности, применяемые сразу.

## Public API

| Экспорт               | Что                                                                              |
| --------------------- | -------------------------------------------------------------------------------- |
| `AvatarPicker`        | observer без пропсов: аватар, шторка источников, лента своих изображений, снятие |
| `PrivacySettingsForm` | observer без пропсов: аватар / телефон / время в сети — все, контакты, никто     |

## Устройство

- `model/useAvatarVM.ts`:
  - новое фото: `AVATAR_SOURCES` (галерея, камера) → `IFileStore.upload` →
    `IUserStore.updateProfile({ avatarId })`;
  - выбор из `IFileStore.images` — сразу `updateProfile`; снятие — `avatarId: null`;
  - при монтировании грузит файлы, если список ещё не загружался; флаг `isBusy` в `useState`.
- `model/usePrivacyVM.ts` — `loadPrivacy()` при монтировании; `change(key, level)` →
  `updatePrivacy` с одним полем, ошибка — `notifyApiError`; `error` только пока настроек нет,
  `retry` — повтор загрузки. Тест — `model/__tests__/usePrivacyVM.test.ts`.

## Зависимости

- `@entities/user` (`IUserStore`), `@entities/file` (`IFileStore`),
  `@shared/lib/{media-picker,http,notifications}`, `@shared/ui`.
- Используется: `pages/stack/profile`.

## Gotcha

- Лента изображений — только из уже загруженных страниц «моих» файлов; если на экране «Файлы»
  включён режим «все», `images` пуст.
