---
id: architecture/public-api
title: Public API
summary: Один index.ts на слайс, в shared — на каждый модуль; экспортируется только поддерживаемое.
layer: stack
roles: [developer, architect, reviewer]
stages: [implementation, review]
depends_on: [architecture/dependencies]
---

# Public API

## Слайсы: entities / features / widgets / pages

Один public API на слайс — `index.ts` в корне. У сегментов своих `index.ts` нет:

```
<layer>/<slice>/index.ts        ← public API
<layer>/<slice>/model/store.ts  ← реализация, без model/index.ts
```

Снаружи — только через него:

```ts
import { IEntityStore, EntityAvatar } from "@entities/<entity>"; // ✅
import { IEntityStore } from "@entities/<entity>/model/store"; // ❌ deep import
```

## shared

Слайсов нет, поэтому public API — на каждом самостоятельном модуле:

```
shared/ui/<component>/index.ts
shared/lib/<module>/index.ts
```

## Что экспортируется

- Только то, что поддерживается для внешних потребителей. Экспортов «на всякий
  случай» нет: внутренние компоненты, классы сторов и детали реализации не
  экспортируются.
- `index.ts` — только реэкспорты, без реализации.
- Без массового `export *`, если он раскрывает внутреннее или создаёт коллизии.
- Типы — явно через `export type`.

Оформление экспортов — [conventions/exports-imports](../30-conventions/exports-imports.md).
