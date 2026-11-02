---
module: entities/file
summary: Файлы пользователя — список страницами («мои» или все), загрузка с прогрессом, удаление и realtime-события.
---

# file

Стор «Моих файлов»: бесконечный список, загрузка одного файла и пачки, удаление; события
`file:*` с других устройств обновляют список.

## Public API

| Экспорт            | Что                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `IFileStore`       | `filesHolder` (`InfiniteHolder`), `files`, `mine`/`setMine`, `images`, загрузка, `remove`, `reset` |
| `IFileRealtime`    | `SupportInitialize`: подписка на время сессии                                                      |
| `FILE_PERMISSIONS` | `file:view`, `file:delete` (у обоих есть область `:own`)                                           |
| `fileModule`       | DI-регистрация (оба singleton)                                                                     |

## Устройство

- `model/store.ts` — `FileStore`: страницы по 20 через `getMyFiles({ mine, offset, limit })`.
  `setMine` сбрасывает и перезагружает список.
- `upload(file)` — `uploadProgress` 0..1 из `onUploadProgress`; загруженный встаёт в начало
  (`prependIfNotExists`). `uploadMany` — по одному, `uploadQueue` = `{ index, count }`; ошибка
  файла не останавливает остальные, результат — `{ uploaded, errors }`.
- `images` — изображения из загруженных страниц своих файлов (кандидаты в аватар).
- `model/realtime.ts`: `file:uploaded` → в начало, `file:processed` → обновить, если есть,
  `file:deleted` → убрать. После переподключения сокета (не первого) — `refresh()`, если список
  уже загружался.
- Тесты — `model/__tests__/file-{store,realtime}.test.ts`.

## Зависимости

- `@shared/api` (`IMainApi`, `toHolderPage`), `@shared/lib/{holders,files,http,socket,di}`.
- Используется: `app` (DI, `AppDataStore`), `features/file-upload`, `delete-file`,
  `profile-settings`, `pages/stack/files`.

## Gotcha

- При `mine === false` (все файлы) `images` пуст — выбор аватара из загруженных недоступен.
- Права проверяет потребитель через `IUserStore.scope`/`canOn` с `FILE_PERMISSIONS`: стор их не
  знает.
