---
module: features/delete-file
summary: Сценарий удаления файла — подтверждение, удаление в сторе и уведомление об ошибке.
---

# delete-file

Сценарий без UI: страница вызывает хук и решает, что делать с результатом.

## Public API

| Экспорт         | Что                                                                |
| --------------- | ------------------------------------------------------------------ |
| `useDeleteFile` | возвращает `(file: IFileDto) => Promise<boolean>` — удалён ли файл |

## Устройство

- `model/useDeleteFile.ts`: `useConfirm` (заголовок «Удалить файл?», описание — имя файла,
  destructive) → `IFileStore.remove(id)` → при ошибке `notifyApiError` и `false`.
- Список обновляет стор: `remove` убирает элемент из `filesHolder` при успехе.
- Тест — `model/__tests__/useDeleteFile.test.ts`.

## Зависимости

- `@entities/file` (`IFileStore`), `@shared/lib/{http,notifications}`, `@shared/ui`
  (`useConfirm`).
- Используется: `pages/stack/files` (кнопка показывается по `IUserStore.canOn("file:delete")`).
