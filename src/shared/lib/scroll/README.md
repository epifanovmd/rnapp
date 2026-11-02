---
module: shared/lib/scroll
summary: Телеметрия скролла на shared values — единственный владелец onScroll, на котором строятся панели, pull-to-refresh и reveal.
---

# scroll

Один scroll-хендлер ведёт shared values (offset, направление, drag/momentum, overscroll,
`maxOffsetY`); любое scroll-зависимое поведение читает их или реагирует через
`useAnimatedReaction`, а не вешает свой onScroll.

## Public API

| Экспорт                                                      | Что                                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `IScrollValues`                                              | только shared values — контракт для чтения                                   |
| `IScrollTelemetry`                                           | `IScrollValues` + `scrollHandler` и `handlers` — контракт владельца onScroll |
| `IScrollWorkletHandlers`, `TScrollDirection`                 | worklet-обработчики фаз скролла, направление                                 |
| `useScrollTelemetry(external?)`                              | создать телеметрию; `external` — чейнинг сторонних worklet-обработчиков      |
| `ScrollProvider`, `ScrollContext`                            | раздать телеметрию экрана вниз                                               |
| `useScroll()`                                                | только потребление; без `ScrollProvider` кидает ошибку                       |
| `useFocusGatedScroll(telemetry)`, `useFocusedScroll()`       | телеметрия вкладки, общей с соседними: события проходят только из фокуса     |
| `resolveDirection`, `resolveMaxOffset`, `resolveOverscroll*` | чистые вычисления по событию (`scroll-metrics.ts`, worklet)                  |

## Устройство

- Владение явное: `useScrollTelemetry` вызывает тот, кто вешает
  `onScroll={telemetry.scrollHandler}` (+ `scrollEventThrottle={16}`); экран раздаёт её
  через `ScrollProvider`, самодостаточный компонент держит локально.
- `useFocusGatedScroll` — для top-tabs под общей шапкой: без шлюза инерция покинутой
  вкладки продолжала бы двигать шапку. Флаги жеста и инерции на blur не сбрасываются
  (сброс = «конец жеста» и доводка навбара после `show()`); зависший `isMomentum`
  снимает начало перетаскивания в новой вкладке. Одиночному экрану шлюз не нужен.

## Зависимости

- `react-native-reanimated`, `@react-navigation/native` (фокус вкладки).
- Потребители: `shared/lib/pull-to-refresh`, `shared/lib/search`,
  `shared/lib/scroll-reveal`, `shared/ui` (`ScreenScroll`, `ImageBar`,
  `useNavbarScrollSync`), `widgets/app-shell`, `pages/tabs/main`, демо плейграунда.
