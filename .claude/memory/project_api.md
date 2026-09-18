---
name: API Layer
description: HTTP-ядро — пайплайн middleware, иерархия ошибок, отмена, несколько бэкендов
type: project
---

## Карта `shared/api/`

| Файл                    | Что                                                                 |
| ----------------------- | ------------------------------------------------------------------- |
| `core/types.ts`         | `HttpRequest`, `RequestOptions`, `RequestContext`, `ApiResponse`    |
| `core/http-client.ts`   | `HttpClient` + интерфейс `IHttpClient` (`request` / `send`)         |
| `core/middleware.ts`    | `HttpMiddleware`, `composeMiddleware` (onion)                       |
| `core/errors.ts`        | `ApiError` и наследники, `toApiError`                               |
| `core/cancelable.ts`    | `CancelablePromise`, `toCancelable`, `mapCancelable`                |
| `core/base-api.ts`      | `BaseApi` — база для рукописных API                                 |
| `core/transport.ts`     | контракт `HttpTransport`                                            |
| `transport/`            | `AxiosTransport` (axios без interceptors)                           |
| `middleware/`           | bearerAuth, queryRace, retry, notifyErrors, withHeaders, transform* |
| `create-http-client.ts` | `createHttpClient`, `createApiMutator`                              |
| `<name>/`               | обвязка одного бэкенда: types (DI-токены), mutator, http-client     |
| `gen/<name>/`           | orval-генерация, **не редактировать**                               |

## Пайплайн

Запрос идёт `HttpClient.send` → middleware (луковица) → `HttpTransport`.
До `await next()` — правка запроса, после — ответа, `catch` вокруг — ошибки.
Повторный `next()` перезапускает только то, что ниже (так сделаны retry и 401-refresh).
Первый middleware в списке — самый внешний.

Порядок основного клиента: `notifyErrors` → `queryRace` → `bearerAuth`.
Тосты видят итог после повторов; повтор по 401 не считается новым участником гонки.

Per-call настройки — второй аргумент любого метода API; middleware расширяют
`RequestOptions` через declaration merging: `auth`, `queryRace`, `retry`,
`notifyErrors`, плюс базовые `headers`, `params`, `timeout`, `baseUrl`, `signal`.

## Ошибки и отмена

Наружу выходит только `ApiError`: `HttpError` (есть `status` и `body`),
`NetworkError`, `TimeoutError`, `CanceledError`, `UnknownApiError`.
Флаги `isServerError` / `isCanceled` / `isUnauthorized` и т.д. — на базовом классе,
сужать тип не нужно. `request()` не реджектится: `{ data }` либо `{ error }`.
`send()` отдаёт полный ответ и реджектится `ApiError`.

Отмена — всегда `CanceledError`, а не отдельная ветка ответа. Холдеры считают
отменой `error.isCanceled` (`shared/lib/holders/holder.types.ts`).
`cancel()` есть у любого результата; при цепочке через `.then()` он теряется —
для этого `mapCancelable`.

## Новый бэкенд

1. `orval.config.ts` → ещё один `defineApi("<name>", { target })`.
2. `<name>/<name>.types.ts` — DI-токены `I<Name>HttpClient` и `I<Name>Api`.
3. `<name>/<name>.mutator.ts` — `createApiMutator(I<Name>HttpClient)`.
4. `<name>/<name>-http-client.ts` — `createHttpClient({ baseUrl, middlewares })`.
5. `api.module.ts` — `bind` клиента (`toDynamicValue`) и API.

Рукописный API — наследник `BaseApi` с собственным клиентом; пример —
`entities/auth/api/session-api.ts` (refresh на клиенте без auth и без тостов,
иначе 401 ушёл бы в рекурсивный refresh).

`baseUrl` принимает геттер — можно менять стенд в рантайме без пересборки.
