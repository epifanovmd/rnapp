---
id: ops/environment
title: Окружение
summary: Требования, соседние репозитории, multi-env через react-native-config — файлы, переменные, как попадают в сборку.
layer: project
roles: [developer, devops]
stages: [implementation]
depends_on: []
---

# Окружение

## Требования

Node.js ≥ 22.11, Yarn 1, Xcode и CocoaPods (iOS), Android SDK (Android), Ruby bundler
для подов.

```sh
yarn                          # зависимости, бинарники Skia/AudioAPI, git-хуки
cd ios && pod install && cd ..
```

Соседние репозитории — рядом с `rnapp`:

- `anchor-list` — локальная зависимость `@epifanovmd/anchor-list` (`link:../anchor-list`);
- `rest-api-template-app` — спецификация OpenAPI для `yarn generate:orval` по умолчанию.

## Multi-env (`react-native-config`)

Файлы `config/env/<окружение>.<платформа>.env`: `development`, `staging`, `production`
× `ios`, `android`.

| Переменная                      | Назначение      |
| ------------------------------- | --------------- |
| `BASE_URL`                      | HTTP API        |
| `SOCKET_BASE_URL`               | WebSocket       |
| `APP_ID_IOS` / `APP_ID_ANDROID` | bundle id       |
| `DISPLAY_NAME`                  | имя приложения  |
| `DEEPLINK_BASE_URL`             | схема deep link |

- В код — через `src/shared/config/env.ts`.
- Android: `build.gradle` читает env в `productFlavors` и подставляет `applicationId`,
  `app_name`, `versionName` (суффикс окружения).
- iOS: `Info.plist` подставляет `$(DISPLAY_NAME)` и `$(DEEPLINK_BASE_URL)`.
- Окружение выбирает команда запуска: схема iOS `rnapp.<env><Debug|Release>`, режим
  Android `<env><Debug|Release>`.
