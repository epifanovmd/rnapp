---
id: ops/git-hooks
title: Git-хуки
summary: lefthook — pre-commit (lint, формат, типы, тесты с покрытием).
layer: project
roles: [devops, developer]
stages: [commit]
depends_on: [process/git]
---

# Git-хуки

`lefthook.yml`, установка — `yarn` (`prepare: lefthook install`). CI нет: проверки идут
локально.

| Хук          | Что                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | последовательно, стоп на первой ошибке: `eslint --fix` + prettier по staged `*.{ts,tsx}`, prettier прочих, `tsc --noEmit`, `jest --coverage` |

- `eslint` запускается с `--no-warn-ignored`: сгенерированный клиент API в индексе не даёт
  предупреждений «файл игнорируется».
- Пропуск хуков (`LEFTHOOK=0`, `--no-verify`) — только по команде пользователя.
