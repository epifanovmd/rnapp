---
module: shared/lib/network
summary: Сервис статуса сети поверх NetInfo — `isOnline` и колбэки переходов онлайн/офлайн для кода вне React.
---

# network

Отвечает на вопрос «есть ли интернет» и сообщает о переходах, как `online`/`offline`
в браузере. Нужен сервисам, которые должны реагировать на появление сети.

## Public API

| Экспорт                 | Что                                                                     |
| ----------------------- | ----------------------------------------------------------------------- |
| `INetworkStatusService` | токен + контракт: `isOnline`, `onOnline(cb)`, `onOffline(cb)` → отписка |
| `NetworkStatusService`  | реализация на `@react-native-community/netinfo`                         |
| `networkModule`         | DI-модуль: токен → `NetworkStatusService`, singleton                    |

## Устройство

- `network.types.ts` — токен и интерфейс, `network.service.ts` — реализация,
  `network.module.ts` — биндинг; регистрация в `app/app.module.ts`.
- Онлайн = `isConnected && isInternetReachable !== false`: подключение без доступа в
  интернет (captive portal) считается офлайном. `isConnected === null` — состояние
  неизвестно и игнорируется.
- Подписка на NetInfo создаётся в конструкторе и живёт всё время жизни singleton.

## Зависимости

- `@react-native-community/netinfo`, `@shared/lib/di`.
- Потребитель — `shared/lib/socket` (при появлении сети поднимает сдавшийся сокет).

## Gotcha

- Пока NetInfo не прислал первое состояние, `isOnline` возвращает `true`.
- Колбэки вызываются только на переходах: первое известное состояние и повторы того же
  значения их не вызывают.
- В тестах модулей, которые тянут сервис, нужен `jest.mock("@react-native-community/netinfo")`.
