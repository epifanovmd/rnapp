---
module: pages/stack/components
summary: Плейграунд UI-кита — экран-оглавление и демо-экраны компонентов, каждый отдельным маршрутом стека.
---

# components

Плейграунд кита: оглавление `Components` и 39 демо-экранов `Components<Name>` — все в
корневом стеке, группа `Private`. Заголовок — `options.title`; экраны с `NO_HEADER`
(Navbar Hidden/Tall/Image, Search, Tabs) рисуют свой `Navbar`. Deep link — `components`
и `components/<name>`. Оглавление открывается с вкладки Playground.

## Public API

| Экспорт                 | Что                                                                       |
| ----------------------- | ------------------------------------------------------------------------- |
| `Components`            | Экран-оглавление                                                          |
| `*Demo`                 | Демо-экраны, по одному на маршрут (имена не всегда совпадают с маршрутом) |
| `ScreenReadyTargetDemo` | Тяжёлый экран; параметр `delay?` (мс) для `useScreenReady`                |

## Устройство

- `component-demos.ts` — `COMPONENT_DEMOS` (`as const`): группы `{ title, demos: [{ route, title }] }`.
  Группа из одного демо — одиночная ссылка, из нескольких — заголовок и варианты;
  `Components` делит группы на две колонки по числу строк, сохраняя порядок. Ссылки —
  `NavLink`, маршрут типизирован по `RootParamList`.
- `demos/` — простое демо — файл `<Name>Demo.tsx` на `DemoScreen` (скролл с отступами,
  safe area, поля над клавиатурой) + `DemoSection` (заголовок, описание, примеры);
  составное — папка с `index.ts` и своей раскладкой (charts, calendar, lists, navbar,
  search, tabs…). Вложенные top-tabs (`TabsDemoNavigator`, `SegmentedPagerDemo`) держат
  param list у себя. Чистая логика — тесты в `__tests__/` рядом.

### Как добавить демо

1. `demos/<Name>Demo.tsx` (или папка с `index.ts`); экспорт из `demos/index.ts` и
   именованный реэкспорт из `index.ts` слайса.
2. Маршрут `Components<Name>` в `src/app/App.screens.ts` (группа `Private`):
   `options.title` или `NO_HEADER`, `linking: "components/<name>"`.
3. Ссылка в `COMPONENT_DEMOS` — новая группа или вариант существующей.

## Зависимости

Только `@shared/ui` (с `chart`, `tabs`, `input-bar`, `context-menu-view`) и `@shared/lib/*`.

## Gotcha

- `ComponentsLists` — бенчмарк ленты AnchorList: фон списка намеренно `#FF00FF`
  (`BLANK_COLOR`) для видимости пустых участков, поэтому ячейки непрозрачные, а у списка
  нет gap и горизонтальных отступов.
- Маршрут в `COMPONENT_DEMOS` без регистрации в стеке ловит typecheck (`NavLink to`).
