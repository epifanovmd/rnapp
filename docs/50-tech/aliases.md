---
id: tech/aliases
title: Path aliases
summary: Шесть алиасов слоёв FSD, где объявлены (tsconfig и babel — синхронно), частые публичные пути shared.
layer: project
roles: [developer]
stages: [implementation]
depends_on: [architecture/dependencies]
---

# Path aliases

| Алиас       | Путь           |
| ----------- | -------------- |
| `@app`      | `src/app`      |
| `@pages`    | `src/pages`    |
| `@widgets`  | `src/widgets`  |
| `@features` | `src/features` |
| `@entities` | `src/entities` |
| `@shared`   | `src/shared`   |

- Объявлены в трёх местах, правятся синхронно: `tsconfig.json` (`compilerOptions.paths`),
  `babel.config.js` (`module-resolver`) и `jest.config.js` (`moduleNameMapper`).
  Расхождение ломает типы, runtime или тесты.
- Внутри слайса или shared-модуля — только относительные пути
  ([architecture/dependencies](../20-architecture/dependencies.md#self-imports)).

## Частые публичные пути

| Что                    | Импорт                                          |
| ---------------------- | ----------------------------------------------- |
| DI                     | `@shared/lib/di`                                |
| холдеры                | `@shared/lib/holders`                           |
| HTTP-движок, сессия    | `@shared/lib/http`, `@shared/lib/session`       |
| сокет                  | `@shared/lib/socket`                            |
| навигация              | `@shared/lib/navigation`                        |
| тема                   | `@shared/lib/theme`                             |
| бэкенды и типы API     | `@shared/api`, `@shared/api/gen/<name>`         |
| конфигурация окружения | `@shared/config/env`, `@shared/config/app-info` |
| UI-кит                 | `@shared/ui`                                    |
