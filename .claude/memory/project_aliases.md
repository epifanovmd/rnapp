---
name: Path aliases
description: Актуальные path aliases проекта — без ~ префикса, без @common
type: project
---

Алиасы (tsconfig.json + babel.config.js):
`@core`, `@api`, `@utils`, `@hooks`, `@di`, `@components`, `@store`, `@navigation`, `@socket`

- Без `~` префикса
- `@common` больше не существует — расформирован на `@utils`, `@hooks`, `@di`
- Holders: `@store/holders`
- DI: `@di`
- Утилиты: `@utils`
- Хуки: `@hooks`
- Слоты: `@components/slots`
- Валидации авторизации: `@core/auth/validations`
- Базовые модели: `@store/models` (DataModelBase, EnumModelBase)
