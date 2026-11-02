---
module: shared/lib/http
summary: HTTP-движок без знания эндпоинтов — клиент, пайплайн middleware, нормализованные ошибки ApiError, отмена, axios-транспорт, тестовый транспорт.
---

# http

Движок, на котором стоят все бэкенды `shared/api`. Не знает ни одного эндпоинта и ни
одной сессии: токен получает через порт `ITokenSource`.

## Public API

| Файл / папка            | Что                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `core/http-client.ts`   | `HttpClient`, `IHttpClient` (`request` / `send`), `HttpClientConfig`                                                    |
| `core/types.ts`         | `HttpRequest`, `RequestOptions`, `RequestContext`, `HttpResponse`, `ApiResponse`, прогресс                              |
| `core/middleware.ts`    | `HttpMiddleware`, `composeMiddleware`                                                                                   |
| `core/errors.ts`        | `ApiError` и наследники, `is*Error`, `toApiError`, `getErrorBody`                                                       |
| `core/cancelable.ts`    | `CancelablePromise`, `toCancelable`, `mapCancelable`, `isCancelablePromise`                                             |
| `core/base-api.ts`      | `BaseApi` — база рукописных API (`get`/`post`/…, `send`, `request`)                                                     |
| `core/transport.ts`     | контракт `HttpTransport`                                                                                                |
| `contract/`             | `ITokenSource` — порт для `bearerAuth`                                                                                  |
| `middleware/`           | `bearerAuth`, `queryRace`, `retry`, `notifyErrors` + `notifyApiError`, `withHeaders`, `transformRequest/Response/Error` |
| `transport/`            | `AxiosTransport`, `axiosErrorToApiError`                                                                                |
| `create-http-client.ts` | `createHttpClient(config, transport = AxiosTransport)`                                                                  |

`testing/fake-transport.ts` (`createFakeTransport`, `createTestClient`, `ok`, `flush`) —
не в бочке, импорт по полному пути только из тестов.

## Устройство

- `HttpClient.send` → middleware (первый в списке — самый внешний) → транспорт. До
  `await next()` — правка запроса, после — ответа, `catch` — ошибки. Повторный
  `next()` перезапускает только нижнюю часть (так устроены `retry` и 401-refresh).
- `request()` не реджектится: `{ data } | { error }`. `send()` отдаёт полный ответ
  (статус, заголовки) и реджектится `ApiError`.
- Ошибки: `HttpError` (`status`, `body`), `NetworkError`, `TimeoutError`,
  `CanceledError`, `UnknownApiError`; флаги `isCanceled`, `isUnauthorized`,
  `isServerError`, `isClientError`… — на базовом классе.
- Отмена — всегда `CanceledError`: `pending.cancel()`, `queryRace`, `options.signal`.
- Per-call options (второй аргумент метода API) расширяются middleware через declaration
  merging: `auth`, `queryRace`, `retry`, `notifyErrors` (`false` — выключить).
- `baseUrl` клиента может быть геттером — стенд меняется без пересборки.

## Поведение middleware

- `notifyErrors` — тост только на сеть, таймаут и 5xx (одинаковые схлопываются по `key`).
  4xx экран показывает сам: `notifyApiError(notifications, error)` пропускает отмену,
  сеть, таймаут и 5xx; принимает и ошибку холдера `{ message, status }`.
- `queryRace` — по умолчанию только GET/HEAD; ключ — метод + URL без query. Изменяющие
  методы участвуют лишь с `queryRace: true`; `false` выключает гонку.
- `bearerAuth` — `ensureFreshToken()` + заголовок; на 401 одно общее обновление и один
  повтор. Запоздавший 401 со старым токеном при уже новом — повтор без refresh.
- `retry` — 2 повтора, пауза 300 мс с удвоением; сеть, таймаут, 5xx у идемпотентных методов.

## Зависимости

- `axios`; тип `INotificationService` из `@shared/lib/notifications`.
- Потребители: `shared/api` (сборка клиентов), `entities/*` и `features/*` (типы
  `ApiError`/`ApiResponse`, `notifyApiError`).

## Gotcha

- `cancel` у результата теряется при цепочке `.then()` — используйте `mapCancelable`.
- Заголовки клиента, запроса и вызова сливаются без учёта регистра.
- У тела `FormData` дефолтный `Content-Type` снимается — иначе axios сериализует форму
  в JSON и файл теряется. Явный `multipart/form-data` не трогается.
- Прогресс (`onUploadProgress`/`onDownloadProgress` → `{ loaded, total, ratio }`) с
  `retry` не сочетать: повтор начинает отсчёт заново.
- Фабрики клиентов принимают транспорт вторым аргументом — в тестах передавать фейк.
