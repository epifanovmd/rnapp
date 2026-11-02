---
module: pages/stack/files
summary: «Мои файлы» — список файлов с бесконечной подгрузкой, загрузкой и удалением по правам.
---

# files

Экран «Мои файлы»: свои файлы или (при праве) все, загрузка новых и удаление. Экран
`Files` корневого стека, группа `Private`, заголовок из `options.title`; параметров нет.
Deep link — `files`. Открывается из меню вкладки Settings.

## Public API

| Экспорт | Что                           |
| ------- | ----------------------------- |
| `Files` | Компонент экрана (`observer`) |

## Устройство

- Данные — `IFileStore` (`filesHolder` — `InfiniteHolder`): `load()` при монтировании,
  `refresh()` на pull-to-refresh, `loadMore()` на `onEndReached`.
- Права — `IUserStore`: переключатель «Мои / Все» (`Segmented` → `fileStore.setMine`)
  виден, только если `scope(FILE_PERMISSIONS.VIEW) === "all"`; кнопка удаления в строке —
  только если `canOn(FILE_PERMISSIONS.DELETE, [ownerId])`. `extraData` списка —
  `userStore.permissions`, чтобы строки перерисовались при смене прав.
- Шапка списка — `FileUploadActions`; удаление — `useDeleteFile` (подтверждение и ошибка —
  внутри фичи).
- `FileRow` — строка: превью (`Avatar`), имя, тип · размер · статус, «Удалить».
- Футер — спиннер подгрузки или «повторить» при `isLoadMoreError`.

## Зависимости

- `@entities/file` — `IFileStore`, `FILE_PERMISSIONS`; `@entities/user` — `IUserStore`.
- `@features/file-upload`, `@features/delete-file`.
- `@shared/ui`, `@shared/lib/utils` (`formatter.bytes`).

## Gotcha

- При уходе с экрана стор возвращается к своим файлам (`setMine(true)` в cleanup
  эффекта): стор общий, выбор аватара в профиле должен видеть только свои.
