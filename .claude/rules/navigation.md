---
paths:
  - "src/app/**"
  - "src/pages/**"
  - "src/shared/lib/navigation/**"
---

# Навигация и экраны

- Конфигурация навигаторов — static-конфиг в `app`; экран — `pages/<navigator>/<page>`;
  guard-группы по авторизации, без навигации после входа/выхода
  ([architecture/navigation](../../docs/20-architecture/navigation.md)).
- Параметры экрана — рядом с экраном (`ScreenProps<Params>`); центральных списков
  параметров и enum-ов экранов нет.
- Deep link — `linking:` в конфиге экрана; бутстрап — `app/hooks/useAppBootstrap.ts`.
- Экраны проекта — [domain/screens](../../docs/60-domain/screens.md), устройство —
  [app](../../src/app/README.md).
