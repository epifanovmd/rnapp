---
module: shared/lib/storage
summary: Синхронное key-value хранилище приложения — контракт IStorageService и реализация на MMKV.
---

# storage

Строковое key-value хранилище, переживающее перезапуск. Синхронное: значения доступны
до первого рендера и первого запроса.

## Public API

| Экспорт              | Что                                                                |
| -------------------- | ------------------------------------------------------------------ |
| `IStorageService`    | токен + контракт: `getItem`, `setItem`, `removeItem`, `getAllKeys` |
| `MmkvStorageService` | реализация на `react-native-mmkv` (`createMMKV()`)                 |
| `storageModule`      | DI-модуль: токен → `MmkvStorageService`, singleton                 |

## Устройство

- `storage.types.ts` — токен и интерфейс, `storage.service.ts` — реализация,
  `storage.module.ts` — биндинг; регистрация в `app/app.module.ts`.
- Значения — только строки; `getItem` отсутствующего ключа → `null`. Сериализацию
  объектов делает потребитель.
- Один общий экземпляр MMKV (хранилище по умолчанию) на всё приложение.

## Зависимости

- `react-native-mmkv`, `@shared/lib/di`.
- Потребители: `shared/api` (refresh-токен через `PersistentTokenStorage` из
  `shared/lib/session`), `shared/lib/theme` (выбор темы), `features/biometric`,
  `widgets/chat` (позиция прокрутки).

## Gotcha

- MMKV — синхронный JSI: `try/catch` и `await` вокруг вызовов не нужны.
- Ключи не разделены пространствами имён — уникальность ключа на совести потребителя.
- В jest MMKV подменён `jest/stubs/react-native-mmkv.js` (подключён в `jest.config.js`).
