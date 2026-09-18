---
name: API Layer
description: HTTP-движок в lib/http и конкретные API в shared/api — пайплайн, ошибки, отмена, несколько бэкендов
type: project
---

## Разделение

- `shared/lib/http/` — **движок**, не знает ни одного эндпоинта. Устроен как
  соседний `shared/lib/socket/`: `contract/`, `core/`, `transport/`, плюс
  `middleware/` и `testing/`.
- `shared/api/` — **только реальные API**, каждый своей папкой на верхнем уровне
  (`main/`, `dummyjson/`), рядом `gen/`, `api.types.ts`, `create-api-mutator.ts`
  и `api.module.ts`.

## `shared/lib/http/`

| Файл                    | Что                                                                 |
| ----------------------- | ------------------------------------------------------------------- |
| `core/types.ts`         | `HttpRequest`, `RequestOptions`, `RequestContext`, `ApiResponse`    |
| `core/http-client.ts`   | `HttpClient` + `IHttpClient` (`request` / `send`)                   |
| `core/middleware.ts`    | `HttpMiddleware`, `composeMiddleware` (onion)                       |
| `core/errors.ts`        | `ApiError` и наследники, `toApiError`                               |
| `core/cancelable.ts`    | `CancelablePromise`, `toCancelable`, `mapCancelable`                |
| `core/base-api.ts`      | `BaseApi` — база для рукописных API                                 |
| `core/transport.ts`     | контракт `HttpTransport`                                            |
| `contract/`             | `ITokenSource` (реализуют слайсы: `entities/auth`, dummyjson)       |
| `middleware/`           | bearerAuth, queryRace, retry, notifyErrors, withHeaders, transform* |
| `transport/`            | `AxiosTransport` (axios без interceptors)                           |
| `testing/`              | `createFakeTransport`, `createTestClient` — тесты без сети          |
| `create-http-client.ts` | `createHttpClient`                                                  |

Импортируется только через публичный `@shared/lib/http`.

## Пайплайн

Запрос идёт `HttpClient.send` → middleware (луковица) → `HttpTransport`.
До `await next()` — правка запроса, после — ответа, `catch` вокруг — ошибки.
Повторный `next()` перезапускает только то, что ниже (так сделаны retry и 401-refresh).
Первый middleware в списке — самый внешний.

Per-call настройки — второй аргумент любого метода API; middleware расширяют
`RequestOptions` через declaration merging: `auth`, `queryRace`, `retry`,
`notifyErrors`, плюс базовые `headers`, `params`, `timeout`, `baseUrl`, `signal`.

Фабрики клиентов принимают вторым аргументом `HttpTransport` — в тестах туда
идёт заглушка, иначе тест уходит в реальную сеть.

## Ошибки и отмена

Наружу выходит только `ApiError`: `HttpError` (есть `status` и `body`),
`NetworkError`, `TimeoutError`, `CanceledError`, `UnknownApiError`.
Флаги `isServerError` / `isCanceled` / `isUnauthorized` — на базовом классе,
сужать тип не нужно. `request()` не реджектится: `{ data }` либо `{ error }`.
`send()` отдаёт полный ответ и реджектится `ApiError`.

Отмена — всегда `CanceledError`, а не отдельная ветка ответа. Холдеры считают
отменой `error.isCanceled` (`shared/lib/holders/holder.types.ts`).
`cancel()` есть у любого результата; при цепочке через `.then()` он теряется —
для этого `mapCancelable`.

## Что где

`main/` — основной бэкенд, orval-генерация, `bearerAuth` поверх сессии из
`entities/auth`, проактивный refresh по exp токена.

`dummyjson/` — публичный https://dummyjson.com, рукописный `BaseApi`: товары и
`auth/me`. Своя сессия на общем `TokenSession`. URL — константа в слайсе,
не `config/env`.

Токены и refresh — общий слой `shared/lib/session`, см. `project_session.md`.

## Одинаковая регистрация

Каждый бэкенд лежит в своей папке и регистрируется в `api.module.ts` одной и
той же четвёркой:

```
auth-API (обновление токенов) → сессия → HTTP-клиент → API
```

Фабрика клиента у всех принимает `ApiClientDeps { session, notifications }`
(см. `api.types.ts`) и сама выбирает middleware: у `main` — `queryRace`
(экраны перезапрашивают одни эндпоинты), у `dummyjson` — `retry`
(публичный сервис в интернете).

## Новый бэкенд

Генерируемый: `orval.config.ts` → `defineApi("<name>", { target })`, затем
`<name>/<name>.types.ts` (DI-токены), `<name>/<name>.mutator.ts`
(`createApiMutator`), `<name>/<name>-auth.api.ts`, `<name>/<name>-session.ts`,
`<name>/<name>-http-client.ts` и четыре bind в `api.module.ts`.

Рукописный — то же самое, только вместо генерации класс-наследник `BaseApi`;
пример целиком — `dummyjson/`.

`baseUrl` принимает геттер — стенд можно менять в рантайме без пересборки.

## Путь запроса: от вызова до сети

```
стор / хук / экран
  │  api.getUsers({ limit: 20 }, { retry: false })
  ▼
┌──────────────────────────────┬───────────────────────────────┐
│ сгенерированный клиент       │ рукописный API (BaseApi)      │
│ gen/<name>/api.ts            │ dummyjson.api.ts              │
│   mainMutator(request, opts) │   this.get<T>(url, opts)      │
└──────────────┬───────────────┴───────────────┬───────────────┘
               ▼                               ▼
      I<Name>HttpClient.getInstance()   http (в конструкторе)
               └───────────────┬───────────────┘
                               ▼
              HttpClient.request(request, options)
                 │ обёртка над send(): результат → { data } | { error }
                 ▼
              HttpClient.send(request, options)
                 ├ _normalizeRequest: METHOD ▲, baseUrl, headers, params, timeout
                 ├ new AbortController → ctx.signal, ctx.cancel
                 ├ linkExternalSignal(options.signal)
                 └ ctx = { request, options, signal, state, cancel }
                 ▼
   ┌────────── пайплайн middleware (первый = самый внешний) ──────────┐
   │ notifyErrors  ──вход──▶                                          │
   │   queryRace   ──вход──▶  отменить прошлый запрос на тот же ключ  │
   │     bearerAuth──вход──▶  ensureFreshToken() + Authorization      │
   │                                                                  │
   │            terminal: signal.aborted ? CanceledError              │
   │                      : transport.send(ctx.request, ctx.signal)   │
   │                                                                  │
   │     bearerAuth◀─выход──  401 → refresh → повторный next()        │
   │   queryRace   ◀─выход──  снять себя из карты гонок               │
   │ notifyErrors  ◀─выход──  тост на network / timeout / 5xx         │
   └──────────────────────────────────────────────────────────────────┘
                 ▼
          AxiosTransport.send(request, signal)
                 │ axios.request({ baseURL, url, method, params, data, headers, signal })
                 ▼
                сеть
```

Стек middleware у каждого бэкенда свой: `main` — `notifyErrors → queryRace →
bearerAuth`, `dummyjson` — `notifyErrors → retry → bearerAuth`.

## Обратный путь

```
axios ответ ──▶ AxiosTransport ──▶ HttpResponse { status, statusText, headers, data }
                                        │ разворачивается через middleware наружу
                                        ▼
                              HttpClient.send → resolve
                              HttpClient.request → { data }

axios ошибка ─▶ axiosErrorToApiError
                  ├ isCancel            → CanceledError
                  ├ есть response       → HttpError { status, body, headers }
                  ├ ECONNABORTED/ETIMEDOUT → TimeoutError
                  ├ ERR_NETWORK / request  → NetworkError
                  └ иначе               → UnknownApiError
                                        │ поднимается через middleware
                                        ▼
                              HttpClient.send: если signal.aborted → CanceledError,
                                               иначе toApiError(...)
                              HttpClient.request → { error }
```

Наружу из клиента выходит только `ApiError`. Промис `request()` не реджектится.

## Ветка обновления токена

```
bearerAuth ──▶ ITokenSource (им является TokenSession)
   ├ ensureFreshToken() → shouldRefresh(tokens)?
   │     main:      refreshBeforeJwtExpiry(60) — по exp JWT, до запроса
   │     dummyjson: refreshNever               — только реакция на 401
   └ refreshToken() → дедупликация одного in-flight → config.refresh(refreshToken)
                              ▼
                  <Name>AuthApi.refresh (BaseApi)
                              ▼
                  отдельный HttpClient БЕЗ bearerAuth и notifyErrors
                              │ иначе 401 от самого refresh ушёл бы в рекурсию
                              ▼
        успех → setTokens → storage.write → onTokenChange (слушает сокет)
        ошибка → clear() → onSessionExpired → AuthStore.signOut()
```

## Отмена

```
pending.cancel("ушли с экрана")   или   queryRace   или   options.signal
                              ▼
                     controller.abort(reason)
                              ▼
          axios прерывает запрос; terminal больше не зовёт транспорт
                              ▼
        любая ошибка после abort → CanceledError (error.isCanceled === true)
                              ▼
        request() → { error }; холдеры молча игнорируют такой ответ
```

`cancel` есть у результата каждого метода API. При цепочке через `.then()` он
теряется — для этого `mapCancelable`.

## Регистрация в DI

Порядок одинаков для каждого бэкенда, `api.module.ts`:

```
auth-API (обновление токенов) → сессия → HTTP-клиент → API
```

Фабрика клиента принимает `ApiClientDeps { session, notifications }`; сессия у
каждого бэкенда своя, `toService` связывает сессию основного бэкенда ещё и с
`ITokenProvider` для сокета.

## Тело запроса и ответа

- Заголовки клиента, запроса и вызова сливаются **без учёта регистра**: имя из
  вызова перекрывает одноимённое из конфига, а не соседствует с ним.
- У тела `FormData` дефолтный `Content-Type` снимается. Иначе axios в
  `transformRequest` увидит JSON-тип и сериализует форму в JSON — файл потеряется.
  Явный `multipart/form-data` в запросе или вызове не трогается.
- Прогресс передачи — `onUploadProgress` / `onDownloadProgress` в запросе или в
  per-call options; транспорт нормализует событие axios в `{ loaded, total, ratio }`.
  С `retry` вместе не используют: повтор начинает отсчёт заново.
- `BaseApi.send` отдаёт полный ответ (статус, заголовки) и реджектится `ApiError` —
  для счётчиков в заголовках и различения 204 от пустого тела. `BaseApi.request`
  остаётся result-style.
- `getErrorBody<TBody>(error)` достаёт тело ошибки у `HttpError`; у сетевых
  ошибок, таймаутов и отмены вернёт `undefined` — ветвиться на `kind` не нужно.
