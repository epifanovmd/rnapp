---
module: entities/audit
summary: Журнал действий текущего пользователя — лента по курсору сервера и живые события audit:created.
---

# audit

Свои события безопасности: страницы по непрозрачному курсору бэкенда, новые события по сокету
встают в начало ленты.

## Public API

| Экспорт          | Что                                                                               |
| ---------------- | --------------------------------------------------------------------------------- |
| `IAuditStore`    | `eventsHolder` (`CursorHolder`), `events`, `load`, `loadMore`, `prepend`, `reset` |
| `IAuditRealtime` | `SupportInitialize`: подписка на время сессии                                     |
| `auditModule`    | DI-регистрация (оба singleton)                                                    |

## Устройство

- `model/store.ts` — `AuditStore`: `IMainApi.getMyAudit({ cursor, limit: 20 })`; курсор
  следующей страницы — приватный `_nextCursor` из ответа (`null` — страниц больше нет).
  Курсоры холдера по `keyExtractor` не используются.
- Поколения: `load()` и `reset()` начинают новое поколение и сбрасывают курсор; ответы прежних
  `load`/`loadMore` (в том числе пришедшие после выхода) не применяются. `loadMore` не уходит во
  время `load`.
- `prepend(event)` — только после успешной загрузки и без дубля по `id`.
- `model/realtime.ts` — `audit:created` → `prepend`; после переподключения сокета (не первого
  подключения) лента перечитывается `load()`, если уже загружена.
- Тесты — `model/__tests__/audit-{store,realtime}.test.ts`.

## Зависимости

- `@shared/api` (`IMainApi`), `@shared/lib/{holders,socket,di}`.
- Используется: `app` (DI, `AppDataStore` — старт realtime и `reset` при выходе),
  `pages/stack/audit`.
