---
paths:
  - "Makefile"
  - "lefthook.yml"
  - "package.json"
  - "babel.config.js"
  - "metro.config.js"
  - "orval.config.ts"
  - "config/env/**"
  - "scripts/*.mjs"
  - "scripts/splash/**"
  - "tsconfig.json"
  - "jest.config.js"
  - "babel-jest.config.js"
  - "index.js"
  - "app.json"
  - "splash.config.mjs"
  - ".prettierrc.json"
  - "Gemfile"
---

# Инфраструктура

- Окружение, сборка, хуки — `docs/70-ops/`
  ([commands](../../docs/70-ops/commands.md), [environment](../../docs/70-ops/environment.md),
  [build](../../docs/70-ops/build.md), [git-hooks](../../docs/70-ops/git-hooks.md)).
- Алиасы — в `tsconfig.json`, `babel.config.js` и `jest.config.js` синхронно
  ([tech/aliases](../../docs/50-tech/aliases.md)).
- Секреты не коммитятся; prod-ключ подписи не настроен — не добавлять без решения
  пользователя.
