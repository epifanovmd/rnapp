---
module: pages/stack/audit
summary: «Журнал действий» — события безопасности текущего пользователя с подгрузкой по курсору.
---

# audit

Экран «Журнал действий»: события безопасности пользователя, новые сверху. Экран `Audit`
корневого стека, группа `Private`, заголовок из `options.title`; параметров нет.
Deep link — `audit`. Открывается из меню вкладки Settings.

## Public API

| Экспорт | Что                           |
| ------- | ----------------------------- |
| `Audit` | Компонент экрана (`observer`) |

## Устройство

- Данные — `IAuditStore`: `load()` при монтировании и на pull-to-refresh, `loadMore()` на
  `onEndReached`; список — `auditStore.events`, состояние — `eventsHolder`
  (`CursorHolder`).
- `FlatList`: пустой список — спиннер, текст ошибки или «Событий нет»; футер — спиннер
  подгрузки или кнопка «повторить» при `isLoadMoreError`.
- Строка события — `renderEvent` в том же файле: тип, дата · IP, user agent.
- Своего VM и сокета нет: realtime-обновление журнала живёт в `entities/audit`.

## Зависимости

- `@entities/audit` — `IAuditStore`.
- `@shared/ui`, `@shared/lib/utils` (`formatter`), тип `AuditEventDto` из `@shared/api/gen`.

## Gotcha

- Курсор непрозрачный и хранится в сторе (`nextCursor` сервера), а не выводится из
  элементов — страница только вызывает `load`/`loadMore`.
- После ошибки подгрузки `onEndReached` повторно не срабатывает — поэтому повтор вынесен
  в кнопку футера.
