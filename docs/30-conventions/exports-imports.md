---
id: conventions/exports-imports
title: Экспорты и импорты
summary: Оформление index.ts, aliases снаружи и относительные пути внутри, import type, сортировка, без циклов через barrel.
layer: stack
roles: [developer, reviewer]
stages: [implementation, review]
depends_on: [architecture/public-api]
---

# Экспорты и импорты

## Экспорты

Корневой `index.ts` слайса — внешний контракт, без реализации:

```ts
export { FeatureForm } from "./ui/FeatureForm";
export { useFeature } from "./model/useFeature";
export type { FeatureFormValues } from "./model/types";
```

- Без массового `export *`, если он раскрывает внутреннее или даёт коллизии.
- Deep import во внутреннюю структуру чужого слайса запрещён.

## Импорты

- Между слоями и слайсами — aliases ([tech/aliases](../50-tech/aliases.md)).
- Внутри своего слайса или shared-модуля — относительные пути.
- Импорт — через public API внешнего слайса.
- Сортировка автоматическая (`simple-import-sort`).
- Без циклических зависимостей через barrel-файлы.
- Type-only зависимости — `import type`.

```ts
// ✅
import { IEntityStore } from "@entities/<entity>";
import type { FeatureFormValues } from "../model/types";

// ❌ deep import; второй — self-import, если файл внутри features/<feature>
import { IEntityStore } from "@entities/<entity>/model/types";
import { FeatureFormValues } from "@features/<feature>";
```
