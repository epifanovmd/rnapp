---
paths:
  - "src/**"
---

# Работа в модуле `src/`

Источник истины — ссылки; здесь выжимка.

- Перед правкой прочитать `README.md` ближайшего модуля (слайс, shared-модуль, `app`);
  карта модулей — [docs/modules.md](../../docs/modules.md).
- Изменилось поведение, public API, gotcha — обновить README в той же задаче. Новый
  модуль — README по [шаблону](../../docs/00-meta/templates/module-readme.md).
- Место кода — [placement](../../docs/20-architecture/placement.md); импорт только вниз,
  соседние слайсы не видят друг друга, внутри — относительные пути
  ([dependencies](../../docs/20-architecture/dependencies.md)).
- Внешние импорты — только через `index.ts` слайса; экспортировать только нужное
  ([public-api](../../docs/20-architecture/public-api.md)).
- Именование файлов — [naming](../../docs/30-conventions/naming.md).
- Async-состояние — холдеры; API — `{ data } | { error }`; ошибки не глотать
  ([errors](../../docs/30-conventions/errors.md)).
