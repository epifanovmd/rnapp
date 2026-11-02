---
module: shared/api
summary: Конкретные бэкенды поверх shared/lib/http — основной (orval-генерация) и DummyJSON (рукописный), их сессии, HTTP-клиенты и DI-регистрация.
---

# api

Только реальные API: каждый бэкенд — своя папка со своими сессией, клиентом и DI-токенами.
Движок запросов — `shared/lib/http`, механика токенов — `shared/lib/session`.

## Public API

| Группа    | Экспорт                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main      | `IMainApi` (сгенерированный клиент), `IMainHttpClient`, `IMainSession`, `IMainAuthApi`, `MainAuthApi`, `createMain*`, `mainMutator`, `MAIN_HTTP_TIMEOUT`   |
| пагинация | `toHolderPage`, `IOffsetPage`, `IHolderPage` (`main-pagination.ts`)                                                                                        |
| dummyjson | `IDummyJsonApi`, `IDummyJsonSession` (+ `login`), `IDummyJsonHttpClient`, `IDummyJsonAuthApi`, `createDummyJson*`, `DUMMYJSON_BASE_URL`, типы `DummyJson*` |
| общее     | `apiModule`, `ApiClientDeps { session, notifications }`                                                                                                    |

Модели и функции основного бэкенда — `gen/main/api.ts` и `gen/main/model/`
(импорт `@shared/api/gen/main/model`). `gen/` генерирует orval, руками не правится.

## Устройство

- Каждый бэкенд регистрируется в `api.module.ts` одной четвёркой:
  auth-API → сессия → HTTP-клиент → API.
- Фабрика клиента принимает `ApiClientDeps` и сама выбирает стек middleware:
  `main` — `notifyErrors → queryRace → bearerAuth`, `dummyjson` — `notifyErrors → retry →
bearerAuth`.
- Auth-API (refresh, login) ходит по отдельному клиенту без `bearerAuth` и тостов —
  иначе 401 самого обновления ушёл бы в новое обновление.
- `main`: `orval.config.ts` → `gen/main/`; сгенерированные функции зовут `mainMutator`,
  тот резолвит `IMainHttpClient` из DI в момент вызова. Сессия — `PersistentTokenStorage`
  (ключ `app:refresh_token`), запас 60 с; конец сессии — только HTTP 4xx, кроме 429.
  Все запросы несут `X-Device-Name`/`X-Device-Type` (`main-device.ts`).
- `dummyjson` — рукописные `BaseApi`, сессия в памяти, только реакция на 401 (бэкенд не
  отдаёт срок). URL — константа в слайсе, а не `config/env`.
- `ITokenProvider` сокета связан с `IMainSession` через `toService`: сокет и HTTP
  основного бэкенда делят одну сессию. Проводку покрывает `__tests__/api-module-wiring.test.ts`.

## Зависимости

- `@shared/lib/http`, `@shared/lib/session`, `@shared/lib/di`, `@shared/lib/storage`,
  контракты `@shared/lib/notifications` и `@shared/lib/socket`; `@shared/config/env`;
  `react-native-device-info`.
- Потребители: `entities/user`, `entities/auth`, `entities/file`, `entities/audit`,
  `features/*`, `pages/stack`, `app`.

## Gotcha

- `api.module.ts` и `api.types.ts` импортируют `notifications/notification.types` и
  `socket/contract` в обход бочек намеренно: бочки тянут RN-компоненты и socket.io/NetInfo.
- Списки основного бэкенда — `{ items, total, offset, limit }`; для `InfiniteHolder` —
  адаптер `toHolderPage` через `mapCancelable`, для `CollectionHolder.fromApi` —
  extractor `page => page.items`.
- Публичные эндпоинты (без токена) вызываются с `{ auth: false }` — иначе их 401 уйдёт в
  refresh.
- Новый генерируемый бэкенд: `defineApi("<name>", …)` в `orval.config.ts` +
  `<name>/<name>.mutator.ts` с экспортом `<name>Mutator` + четвёрка биндингов.
