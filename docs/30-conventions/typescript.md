---
id: conventions/typescript
title: TypeScript и типы
summary: Без any и небезопасных assertion, типы рядом с владельцем, без shared/types, DTO у API, явный export type.
layer: stack
roles: [developer, reviewer]
stages: [implementation, review]
depends_on: []
---

# TypeScript и типы

- Не использовать `any`, если тип выражается безопасно.
- Не скрывать ошибку типов необоснованными assertion и `as unknown as`. Cast в
  аргументе обобщённой функции может скрыть реальную ошибку от компилятора —
  передавать типизированный extractor/mapper.
- Тип располагается максимально близко к владельцу. Общий `shared/types` и сегмент
  `types` не создаются.
- DTO — рядом с API-контрактом; доменная модель — в `model`.
- Публичные типы экспортируются явно через `export type`.
- Глобальные declaration augmentation — только для действительно глобальных
  контрактов. Расширение опций через declaration merging — там, где модуль так
  спроектирован.
