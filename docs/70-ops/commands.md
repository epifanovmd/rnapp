---
id: ops/commands
title: Команды проекта
summary: Быстрая и полная проверка, тест одного файла, форматирование, запуск на платформах, генерация, документация.
layer: project
roles: [all]
stages: [implementation, verification]
depends_on: []
---

# Команды проекта

Все команды — из корня репозитория.

## Проверки

| Назначение                | Команда                                                         |
| ------------------------- | --------------------------------------------------------------- |
| быстрая проверка итерации | `yarn lint && yarn typecheck` + `yarn test <путь>` области      |
| тест одного файла / папки | `yarn test <путь>`                                              |
| полная проверка           | `yarn run check` — lint, format:check, typecheck, test:coverage |
| форматирование файлов     | `node_modules/.bin/prettier --write <файлы>`                    |
| автоисправление линтера   | `yarn lint:fix`                                                 |
| документация              | `yarn docs:index`                                               |

`yarn check` без `run` — встроенная команда Yarn 1, а не проверка проекта.
`make check|lint|typecheck|test` — те же проверки.

Нативную часть проверка не собирает. После изменений в `ios/`, `android/`, `modules/`
или нативных зависимостях — сборка платформ ([build](build.md)).

## Запуск и сборка

| Команда                                       | Что делает                                     |
| --------------------------------------------- | ---------------------------------------------- |
| `yarn start`                                  | Metro с очисткой кэша                          |
| `yarn ios:{Dev,Stg,Prod}-{Debug,Release}`     | запуск на iOS со схемой окружения              |
| `yarn android:{Dev,Stg,Prod}-{Debug,Release}` | запуск на Android с режимом окружения          |
| `yarn android:build`                          | `assembleProductionRelease`                    |
| `yarn clean:android`                          | `gradlew clean`                                |
| `yarn reinstall`                              | watchman, `node_modules`, `pod install` с нуля |

## Генерация

| Команда               | Что делает                                                                  |
| --------------------- | --------------------------------------------------------------------------- |
| `yarn generate:orval` | клиент API в `src/shared/api/gen/` (`MAIN_SWAGGER` — путь/URL спецификации) |
| `yarn splash`         | ассеты splash из `splash.config.mjs`                                        |
| `yarn restore:native` | перезалить бинарники Skia и AudioAPI                                        |
