---
module: shared/lib/socket
summary: Socket.IO-транспорт — одно соединение с токеном через контракт ITokenProvider, переподключение, приостановка в фоне, комнаты со счётчиком подписок, React-хуки.
---

# socket

Транспорт реального времени. Токен получает через контракт `ITokenProvider`, реализацию
связывает `shared/api/api.module.ts` (сессия основного бэкенда).

## Public API

| Экспорт                                            | Что                                                                                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ISocketTransport`                                 | токен + контракт: `initialize`, `connect`, `disconnect`, `on`, `emit`, `emitWithAck`, `onConnect`, `onDisconnect`, `onStatusChange`, `state` |
| `SocketTransport`, `socketModule`                  | реализация и DI-модуль (singleton)                                                                                                           |
| `ITokenProvider`                                   | контракт токена (`contract/`)                                                                                                                |
| `subscribeSocketRoom(socket, type, id, onRejoin?)` | вход в комнату вне React, возвращает отписку                                                                                                 |
| `useSocketRoom(type, id, onRejoin?)`               | комната на жизнь компонента; без `id` — не входить                                                                                           |
| `useSocketEvent(event, handler, enabled?)`         | подписка на событие сервера, обработчик всегда свежий                                                                                        |
| `useSocketStatus`, `useIsSocketConnected`          | состояние подключения (`useSyncExternalStore`)                                                                                               |
| `createFakeSocket`                                 | `@shared/lib/socket/testing` — фейк для тестов моделей                                                                                       |

## Устройство

- `transport/socket.transport.ts` — одно соединение socket.io. Жизненный цикл ведёт
  `app` (`app-data-store.ts`): `initialize()` при входе подписывается на токен,
  `IAppStateService`, `INetworkStatusService` и подключает; освобождение — `disconnect`.
- Токен запрашивается перед каждым handshake (`auth`-колбэк + `ensureFreshToken`).
  Новый токен уходит по живому соединению (`auth:refresh`), в том числе по `auth:expired`.
- Сетевые обрывы переподключает сам socket.io. Когда он сдаётся (сервер отказал или
  разорвал), транспорт обновляет токен и повторяет с задержкой 1→2→4→8→10 с
  (`reconnect-scheduler.ts`).
- Через 30 с в фоне сокет приостанавливается (подписчики и сокет сохраняются); по
  возвращении или появлении сети сдавшийся сокет поднимается сразу, живой проверяется
  heartbeat-пингом.
- `emit` при отсутствии соединения кладётся в очередь до `connect` (`emit-queue.ts`).
- `rooms.ts`: `room:subscribe { type, id }` с ack. Подписки на `type:id` считаются по
  ссылкам: вход у первого подписчика, `room:unsubscribe` — после последней отписки и
  только при подключённом сокете.

## Зависимости

- `socket.io-client`; `@shared/config/env` (`SOCKET_BASE_URL`), `@shared/lib/app-state`,
  `@shared/lib/network`, `@shared/lib/di`, `@shared/lib/hooks`, `@shared/lib/utils`.
- Потребители: `entities/user`, `entities/file`, `entities/audit` (realtime),
  `shared/lib/live`, `app`.

## Gotcha

- Подписки `on`/`onConnect` (и комнаты) переживают `disconnect()` и переходят на новый
  сокет — снимает их только владелец.
- Отказ сервера (`ok: false`) или `room:revoked { type, id }` — повторные входы
  прекращаются; новый подписчик той же комнаты пробует войти снова.
- `onRejoin` не вызывается на первом подключении — только на переподключениях. События
  за время обрыва не доставляются: в `onRejoin` данные перечитываются.
- Приостановка в фоне реджектит незавершённый `connect()`, иначе по возвращении он
  вернул бы зависший промис.
- Бочка тянет транспорт (socket.io, NetInfo): DI-модули импортируют
  `@shared/lib/socket/contract` напрямую. В тестах модулей с сокетом нужны
  `jest.mock("@react-native-community/netinfo")` и `jest.mock("socket.io-client")`.
