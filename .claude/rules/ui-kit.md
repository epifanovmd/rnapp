---
paths:
  - "src/shared/ui/**"
  - "src/shared/lib/theme/**"
  - "src/shared/lib/slots/**"
  - "src/pages/stack/components/**"
---

# UI-кит и тема

- Внутри `shared/ui` — только относительные пути; новый компонент — папка с `index.ts`,
  экспорт в barrel, демо-экран в плейграунде `pages/stack/components`.
- Цвета и отступы — из темы (`useTheme`, `makeThemeStyles`), не литералы.
- Инвентарь, слоты и gotcha — [shared/ui](../../src/shared/ui/README.md),
  [shared/lib/slots](../../src/shared/lib/slots/README.md).
