---
module: shared/lib/pull-to-refresh
summary: Логика pull-to-refresh — state machine на shared values и адаптеры ввода (скролл, жест, AnchorList); визуал строится на месте вызова.
---

# pull-to-refresh

Протяжка для обновления без системного `RefreshControl`. Модуль отдаёт только логику:
`pullDistance`, `progress`, `state`; индикатор рисует потребитель (в ките —
`RefreshIndicator`).

## Public API

| Экспорт                                                                                                                                             | Что                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `usePullToRefreshController(config)`                                                                                                                | ядро: state machine без источника ввода и визуала                                                  |
| `usePullToRefreshScroll({ telemetry, ... })`                                                                                                        | адаптер для скроллящегося компонента поверх `shared/lib/scroll` → `+ gesture`, `contentTranslateY` |
| `usePullToRefreshGesture(config)`                                                                                                                   | адаптер для нескроллящегося компонента: pan-жест с rubber-band                                     |
| `useAnchorListPullToRefresh(config)`                                                                                                                | связка со списком AnchorList → `+ telemetry`, `listProps`                                          |
| `usePullToRefreshHaptics(haptics, onChange?)`                                                                                                       | worklet `onStateChange` с хаптикой срабатывания                                                    |
| `rubberBandDistance`                                                                                                                                | асимптотическое сопротивление протяжки                                                             |
| `PULL_TO_REFRESH_DEFAULTS`, `resolveMaxPullDistance`                                                                                                | дефолты: порог 80, максимум ×1.5, `minRefreshDuration` 300, возврат 250 мс                         |
| `IPullToRefreshConfig`, `IPullToRefreshController`, `TPullToRefreshState`                                                                           | контракты ядра                                                                                     |
| `IPullToRefreshScrollConfig`, `TPullToRefreshScroll`, `IAnchorListPullToRefreshConfig`, `TAnchorListPullToRefresh`, `TAnchorListPullToRefreshProps` | контракты адаптеров                                                                                |

## Устройство

- Состояния: `idle → pulling → (armed →) refreshing → settling → idle`. `triggerOn`:
  `"threshold"` (по умолчанию) — запуск сразу на пороге, дистанция фиксируется на
  `holdDistance`; `"release"` — запуск при отпускании, между порогом и отпусканием
  `armed`.
- `onRefresh` вернул Promise — завершение автоматическое (не раньше
  `minRefreshDuration`); иначе завершение — `finish()`.
- Источники ввода зовут worklet'ы `beginPull/updatePull/endPull`.
  `usePullToRefreshScroll`: iOS — протяжка из native bounce (`overscrollTop`
  телеметрии, нужен `bounces`), Android — pan-жест с ручной активацией только у верхней
  границы при движении вниз, одновременно с native-жестом скролла.
- `contentTranslateY`: на iOS 0 (контент двигает bounce), на Android = `pullDistance`.
- `useAnchorListPullToRefresh` ведёт протяжку собственной телеметрией списка, а события
  пробрасывает в телеметрию экрана (`telemetry`): общая телеметрия табов несёт скролл
  соседних вкладок.

## Зависимости

- `shared/lib/scroll`, `react-native-gesture-handler`, `react-native-reanimated`,
  `react-native-worklets`, `react-native-haptic-feedback`, type-import
  `@epifanovmd/anchor-list`.
- Потребители: `shared/ui` (`ScreenScroll`, `RefreshIndicator`), `pages/tabs/main`,
  демо плейграунда.

## Gotcha

- `onStateChange` обязан быть worklet'ом — вызывается на UI-потоке.
- Результат `usePullToRefreshScroll` не захватывать в worklet целиком: клонирование на
  UI-поток заморозит вложенный `gesture` — брать нужные shared values деструктуризацией.
- Программный `refresh()` хаптику не вызывает: она только на `armed` или на запуске из
  протяжки.
