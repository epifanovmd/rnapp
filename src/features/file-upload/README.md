---
module: features/file-upload
summary: Загрузка в «Мои файлы» — шторка источников (галерея, камера, документы), очередь и прогресс.
---

# file-upload

Кнопка «Добавить файлы», шторка выбора источника и строка прогресса загрузки.

## Public API

| Экспорт             | Что                                                 |
| ------------------- | --------------------------------------------------- |
| `FileUploadActions` | observer-блок без пропсов: кнопка, прогресс, шторка |

## Устройство

- `model/file-sources.ts` — `FILE_SOURCES`: галерея (до 10 фото), камера, документы
  (`multiple`). Новый источник — новая запись.
- `model/useFileUploadVM.ts` — `selectSource(key)`: `pick()` → `IFileStore.uploadMany(files)`;
  итог тостами: «Загружено: N», одна ошибка — `notifyApiError`, несколько — «Не загружено: N».
  `MediaPickerError` показывается своим текстом, отмена выбора (пустой массив) — тихо.
- `model/upload-status.ts` — `describeUpload`: «Загрузка 2 из 5 · 40%»; при 100% —
  «Обработка на сервере…» с бегущей полосой. Тест — `model/__tests__/upload-status.test.ts`.

## Зависимости

- `@entities/file` (`IFileStore`: `uploadMany`, `uploadProgress`, `uploadQueue`),
  `@shared/lib/{media-picker,files,http,notifications,utils}`, `@shared/ui` (`ActionSheet`,
  `ProgressBar`).
- Используется: `pages/stack/files`.

## Gotcha

- Отправленный целиком файл ещё проверяется сервером — это отдельная стадия, а не «зависло на
  100%».
