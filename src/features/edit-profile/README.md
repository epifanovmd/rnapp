---
module: features/edit-profile
summary: Редактирование личных данных профиля в модальной шторке.
---

# edit-profile

Шторка правки имени, фамилии, пола, даты рождения и локали. Открытие и закрытие — за страницей.

## Public API

| Экспорт            | Что                                             |
| ------------------ | ----------------------------------------------- |
| `EditProfileModal` | observer-`ModalSheet`; пропсы `open`, `onClose` |

## Устройство

- `model/useEditProfileVM.ts`:
  - форма получает `values` из профиля стора с `keepDirtyValues` — живое обновление профиля не
    затирает правки пользователя;
  - `onClosed` (после анимации закрытия) сбрасывает несохранённое;
  - `useLeaveConfirmation` при открытой шторке и dirty-форме;
  - `submit` → `IUserStore.updateProfile`; успех — тост и `onClose`.
- `model/profile-form-values.ts` — `toProfileFormValues` (ISO → локальная полночь, мусор →
  `null`) и `toProfileUpdate` (пустое → `null`, дата `yyyy-MM-dd` без сдвига в UTC). Тест —
  `model/__tests__/profile-form-values.test.ts`.
- Дата рождения — `DateFormField` с `maxDate` = сегодня.

## Зависимости

- `@entities/user` (`IUserStore`), `@shared/lib/{http,navigation,notifications}`, `@shared/ui`,
  `date-fns`.
- Используется: `pages/stack/profile` (кнопка в `headerRight`).

## Gotcha

- Пустое поле очищает значение в профиле (уходит `null`), а не оставляет прежнее.
