---
module: shared/lib/files
summary: Локальный файл для multipart-загрузки в React Native — тип `ILocalFile`, `toFormFile` для FormData, `toFileUri`.
---

# files

Мост между файлом на устройстве и multipart-формой: сетевой слой RN читает файл по
`{ uri, name, type }`, а сгенерированный клиент ждёт `Blob`.

## Public API

| Экспорт            | Что                                                               |
| ------------------ | ----------------------------------------------------------------- |
| `ILocalFile`       | `{ uri, name, type, size? }` — файл, готовый к отправке           |
| `toFormFile(file)` | `{ uri, name, type }`, приведённый к `Blob` для `FormData.append` |
| `toFileUri(path)`  | путь ФС → `file://`-URI (уже готовый URI не трогает)              |

## Устройство

`to-form-file.ts` — функции, `files.types.ts` — тип. Состояния и DI нет.

Использование: `uploadFile({ file: toFormFile({ uri, name, type }) })`.

## Зависимости

- Ни от чего не зависит.
- Потребители: `entities/file`, `features/file-upload`, `features/profile-settings`.

## Gotcha

- Результат `toFormFile` — не настоящий `Blob`: работает только как поле `FormData`
  в RN, читать его методы `Blob` нельзя.
- Сервер сверяет `type` с расширением в `name` — mime должен соответствовать имени.
- `Content-Type` у тела `FormData` выставляет сам HTTP-слой (см. `shared/lib/http`).
