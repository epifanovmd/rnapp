---
module: shared/lib/media-picker
summary: Выбор фото из галереи, снимок камерой и выбор файлов — единый результат ILocalFile[] и типизированная ошибка.
---

# media-picker

Адаптер над `react-native-image-picker` (галерея через системный пикер, камера) и
`@react-native-documents/picker` (файлы). Наружу — локальные файлы, готовые к загрузке.

## Public API

| Экспорт                                       | Что                                                                         |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `pickPhotos({ limit = 0 }?)`                  | фото из галереи; `0` — без ограничения числа                                |
| `takePhoto()`                                 | снимок камерой (в галерею не сохраняется)                                   |
| `pickDocuments({ multiple = true }?)`         | файлы из «Файлов»/хранилищ                                                  |
| `MediaPickerError`, `TMediaPickerErrorCode`   | ошибка `permission` / `unavailable` / `failed` с русским текстом и `detail` |
| `IPickPhotosOptions`, `IPickDocumentsOptions` | опции                                                                       |

## Устройство

- Все функции возвращают `Promise<ILocalFile[]>` (тип из `shared/lib/files`). Отмена
  пользователем — пустой массив, не ошибка; отказ и сбой — `MediaPickerError`.
- Документ отдаётся локальной копией в `cachesDirectory` (`keepLocalCopy`): у
  выбранного файла бывает `content://` или защищённый uri. Файлы, которые не удалось
  скопировать, пропускаются.
- Имя и тип с фолбэками: имя из uri, `image/jpeg` для фото,
  `application/octet-stream` для документов (`to-local-file.ts`, тесты).

## Зависимости

- `shared/lib/files` (тип `ILocalFile`), `react-native-image-picker`,
  `@react-native-documents/picker`.
- Потребители: `features/file-upload`, `features/profile-settings` — источники заданы
  конфигурацией в фиче (`file-sources.ts`, `avatar-sources.ts`).

## Gotcha

- В jest оба пакета замаплены на заглушки `jest/stubs/` (по умолчанию — отмена); в тесте
  подменять через `jest.mock` с фабрикой.
