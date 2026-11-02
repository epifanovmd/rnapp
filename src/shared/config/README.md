---
module: shared/config
summary: Конфигурация окружения и сборки — URL бэкенда и сокета, deeplink, GitHub OAuth из react-native-config, имя и версия приложения.
---

# config

Константы, которые различаются между стендами и сборками. Значения приходят из
нативной сборки, в коде не хардкодятся.

## Public API

| Файл          | Экспорт                                   | Что                                       |
| ------------- | ----------------------------------------- | ----------------------------------------- |
| `env.ts`      | `BASE_URL`, `SOCKET_BASE_URL`             | адреса основного бэкенда и сокета         |
| `env.ts`      | `DEEPLINK_BASE_URL`                       | схема deeplink (`<значение>://`)          |
| `env.ts`      | `GITHUB_CLIENT_ID`, `GITHUB_REDIRECT_URI` | параметры входа через GitHub              |
| `app-info.ts` | `APP_NAME`, `APP_VERSION`                 | имя приложения и версия вида `1.2.0 (42)` |

`index.ts` нет — импорт по файлу: `@shared/config/env`, `@shared/config/app-info`.

## Устройство

- `env.ts` читает `react-native-config`. Файлы окружений — `config/env/<стенд>.<платформа>.env`
  в корне проекта (`development`, `staging`, `production` × `ios`, `android`); на Android
  выбор по варианту сборки — `android/app/build.gradle`.
- Типы ключей — `declare module "react-native-config"` в `src/shared/types.d.ts`:
  новый ключ добавляется и в `.env`-файлы, и туда.
- `app-info.ts` берёт имя, версию и номер сборки из `react-native-device-info`
  (имя — `DISPLAY_NAME` окружения), версию форматирует `formatAppVersion`.

## Зависимости

- `react-native-config`, `react-native-device-info`, `@shared/lib/utils`.
- Потребители: `shared/api` (`BASE_URL`), `shared/lib/socket` (`SOCKET_BASE_URL`),
  `shared/lib/utils` (`toAbsoluteUrl`), `app` (deeplink), `features/sign-in` (GitHub),
  `widgets/app-menu`, `widgets/auth-layout` (версия).

## Gotcha

- Значения читаются один раз при импорте: смена `.env` требует пересборки нативного
  приложения, перезапуска Metro недостаточно.
- В jest `react-native-config` и `react-native-device-info` подменены заглушками из
  `jest/stubs/`.
