# rnapp

Мобильное приложение на React Native поверх бэкенда `rest-api-template-app`: аккаунт,
файлы, журнал, сканеры на камере, чат и плейграунд UI-кита. React Native 0.86 (New
Architecture), TypeScript, MobX + Inversify, React Navigation 7, VisionCamera. Архитектура —
[Feature-Sliced Design](https://feature-sliced.design).

## Быстрый старт

Нужны Node.js ≥ 22.11, Yarn 1, Xcode с CocoaPods и/или Android SDK. Репозитории
`anchor-list` и `rest-api-template-app` лежат рядом с `rnapp`.

```sh
yarn                              # зависимости, нативные бинарники, git-хуки
cd ios && pod install && cd ..
yarn ios:Dev-Debug                # или yarn android:Dev-Debug
```

Перед merge — `yarn run check` (документация, lint, формат, типы, тесты с покрытием);
после нативных изменений — сборка обеих платформ.

## Документация

| Что                                          | Где                                             |
| -------------------------------------------- | ----------------------------------------------- |
| индекс всех документов                       | [docs/README.md](docs/README.md)                |
| модули и их README                           | [docs/modules.md](docs/modules.md)              |
| этапы разработки, багфикс, git               | [docs/10-process/](docs/10-process/workflow.md) |
| архитектура и правила кода                   | `docs/20-architecture/`, `docs/30-conventions/` |
| продукт и экраны                             | `docs/60-domain/`                               |
| команды, окружение, сборка                   | [docs/70-ops/](docs/70-ops/commands.md)         |
| как устроена документация и как её дополнять | [docs/00-meta/](docs/00-meta/doc-system.md)     |

Инструкции для Claude Code — [CLAUDE.md](CLAUDE.md).

## Лицензия

MIT
