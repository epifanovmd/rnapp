---
module: shared/lib/session
summary: Общая механика токенов бэкенда — TokenSession (хранение, дедупликация refresh, тихое обновление по expiresIn, конец сессии), хранилища токенов.
---

# session

Переиспользуемая сессия токенов. Ничего не знает ни об HTTP, ни о конкретном бэкенде:
специфика (как обновлять, где хранить) приходит конфигом.

## Public API

| Экспорт                                          | Что                                                                                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TokenSession`                                   | реализация `ITokenSession`                                                                                                                                       |
| `ITokenSession`                                  | `accessToken`, `tokens`, `sessionId`, `ensureFreshToken`, `refreshToken`, `setTokens`, `clear`, `restoreSession`, `onTokenChange`, `onSessionExpired`, `dispose` |
| `TokenSessionConfig`, `RefreshHandler`           | конфиг: `refresh`, `storage?`, `refreshBufferSeconds?`, `autoRefresh?`, `lockName?`, `isSessionRejected?`                                                        |
| `TokenGrant`, `TokenPair`, `toTokenPair`         | ответ бэкенда → состояние с `expiresAt`/`refreshAt`                                                                                                              |
| `ITokenStorage`                                  | синхронное хранилище: `read`, `write`, `clear`, `subscribe?`                                                                                                     |
| `MemoryTokenStorage`                             | токены только в памяти (по умолчанию)                                                                                                                            |
| `PersistentTokenStorage`                         | поверх `IStorageService`; по умолчанию хранит только refresh-токен                                                                                               |
| `EMPTY_TOKENS`, `DEFAULT_REFRESH_BUFFER_SECONDS` | «сессии нет», запас по умолчанию (60 с)                                                                                                                          |

## Устройство

- Срок — из `expiresIn` ответа по часам клиента на получении; JWT не разбирается. Без
  `expiresIn` сессия живёт только на реакции на 401.
- Запас обновления — `refreshBufferSeconds`, но не больше половины срока.
- `autoRefresh` (по умолчанию да) — таймер тихого обновления; плюс `ensureFreshToken`
  перед каждым запросом (`bearerAuth`) и handshake сокета.
- Параллельные `refreshToken()` делят одно обновление.
- Ошибка refresh: `isSessionRejected(error)` → `clear()` + `onSessionExpired`; иначе
  ошибка временная — токены остаются, повтор через 10 с. По умолчанию сессию
  завершает любая ошибка.
- `ITokenSession` намеренно не наследует `ITokenSource` из `lib/http`: совпадение формы
  проверяется структурно там, где сессию передают в фабрику клиента (`shared/api`).

## Зависимости

- Только тип `IStorageService` из `@shared/lib/storage`.
- Потребители: `shared/api` (сессия на каждый бэкенд), `entities/auth` (`IMainSession`).

## Gotcha

- Поколение сессии растёт на `clear()` и внешнем удалении токенов: ответ refresh,
  запущенного до выхода, отбрасывается — токены не воскресают, повторного
  `onSessionExpired` нет.
- `onTokenChange` вызывает слушателя сразу с текущим значением.
- Если у хранилища есть `subscribe`, токены, записанные снаружи, подхватываются без
  обратной записи, а их исчезновение — конец сессии. `PersistentTokenStorage` его не
  реализует.
- Ветки `document`/`visibilitychange` и `navigator.locks` (`lockName`) — для веба; в RN
  они не срабатывают.
