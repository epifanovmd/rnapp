---
module: features/biometric
summary: Вход по Face ID / Touch ID / отпечатку — регистрация ключа устройства, вход подписью nonce, тумблер в меню.
---

# biometric

Ключ устройства (RSA) регистрируется на сервере для текущего пользователя; вход — подпись
одноразового nonce после биометрического запроса. Одно состояние на меню, экран входа и
бутстрап.

## Public API

| Экспорт                 | Что                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `IBiometricStore`       | `isLoaded`, `isSupported`, `isEnabled`, `canSignIn`, `isBusy`, `label`/`icon`; `load`, `signIn({ auto? })`, `enable`, `disable`, `sync` |
| `BiometricSignInButton` | «Войти по …»; без `canSignIn` ничего не рендерит, на монтировании `load()`                                                              |
| `BiometricMenuItem`     | `SwitchRow` включения; на монтировании `sync()`                                                                                         |
| `biometricModule`       | DI: `IBiometricDevice` (нативный адаптер) и `IBiometricStore`                                                                           |

## Устройство

- `model/store.ts` — `BiometricStore`. Нативка за портом `IBiometricDevice`
  (`native-biometric-device.ts`: react-native-biometrics, device-info, AsyncStorage) — стор
  покрыт тестом на фейках.
- `model/biometric-enrollment.ts` — регистрация `{ userId, deviceId }` в `IStorageService` по
  ключу `app:biometric`. `load()` переносит прежний `userId` из AsyncStorage (deviceId —
  `getUniqueId`) и удаляет его. Сбой `load()` не кешируется.
- `isEnabled` — регистрация того же `user.id`; `canSignIn` — датчик + регистрация любого
  пользователя.
- Вход: датчик → ключ есть → `generateNonce` (`auth: false`) → `sign` → `verifySignature`
  (`auth: false`) → `IAuthStore.restore(tokens)`. Пропускается, если уже идёт вход (`isBusy`)
  или вход паролем (`authStore.isLoading`).
- Включение: `confirmPresence` → `createKey` → `registerBiometric`; провал регистрации забывает
  ключ (новый уже заменил прежний).
- Выключение: `deleteDevice` (404 — успех) + удаление ключа всегда. `sync()`: ключа нет — отзыв
  и сброс; устройства нет в `getDevices` — сброс.
- `model/biometric-outcome.ts` — чистый разбор ошибок в тост и флаг сброса регистрации; тесты —
  `model/__tests__/`.

## Зависимости

- `@entities/auth` (`IAuthStore.restore`), `@entities/user` (`user.id`), `@shared/api`,
  `@shared/lib/{storage,notifications,http,di}`, `@shared/ui`.
- Используется: `app` (DI-модуль, автозапрос в бутстрапе), `widgets/app-menu`
  (`BiometricMenuItem`), `pages/stack/sign-in` (`BiometricSignInButton` в слоте `alternatives`).

## Gotcha

- Сервер на любой провал verify отвечает 401: в пределах срока nonce (5 мин − 10 с) это отзыв
  ключа → сброс; позже — «время истекло» без сброса. Сеть и 5xx — без тоста (его уже показал
  HTTP-клиент).
- Ошибки датчика: `Key not found`/`invalidated` — сброс; lockout — отдельный текст; отмена — тихо
  при `auto` и включении, иначе info.
- Выход из аккаунта регистрацию не трогает; включение другим пользователем заменяет ключ
  (серверная запись прежнего остаётся до отзыва).
- `BiometricMenuItem` без датчика скрыт, но остаётся, если вход уже включён — чтобы выключить.
