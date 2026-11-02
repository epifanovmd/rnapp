---
module: shared/lib/bars
summary: Примитив скрываемой панели (IBar) — state machine видимости на shared values без знания о скролле и визуале.
---

# bars

Общая модель скрываемых панелей (навбар, таб-бар): высота, закреплённая часть, смещение
скрытия и команды show/hide/snap/shift. Как панель реагирует на скролл, решает её
собственный слой, компонент лишь применяет `offset` к transform.

## Public API

| Экспорт                                                            | Что                                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `IBar`, `IBarScreenListeners`, `TBarScrollEdge`                    | контракт панели                                                                |
| `createBar(options?)`                                              | панель вне React на `makeMutable`; `duration` по умолчанию 250 мс              |
| `createBarContext(name)`                                           | `{ Provider, useBar }` для одной панели; `useBar` без провайдера кидает ошибку |
| `useBarHeight(bar)`                                                | высота для вёрстки через `useSyncExternalStore`                                |
| `resolveScrollEdge`                                                | край списка (`top`/`bottom`/`null`), который важнее любого поведения панели    |
| `clampOffset`, `snapOffset`, `barProgress`, `resolveCollapseRange` | чистая геометрия видимости (worklet)                                           |
| `rebaseOffset`, `isRemeasure`, `isNewBarTarget`                    | перемер и идемпотентность анимаций                                             |
| `resolveFollowDelta`, `resolveFollowShift`, `resolveReleaseTarget` | следование за скроллом и решение при отпускании пальца                         |
| `hiddenBarLayout`                                                  | раскладка слоя скрываемой шапки до и после первого замера                      |

## Устройство

- Ход скрытия = `height − pinned` (`setPinnedHeight` — закреплённая часть, например
  StickyContent у HiddenBar). Пока высота 0, `hide/snap/shift` — no-op.
- Высота хранится дважды: shared value для worklet'ов и JS-зеркало для вёрстки
  (`getHeight`/`subscribeHeight`) — в React-state её нет.
- Смена высоты или закреплённой части перебазирует `offset` на UI-потоке в том же кадре
  (`rebaseOffset`: скрытая остаётся скрытой). `inset` — та же высота, но перемер
  анимируется: отступ контента не прыгает при живой высоте шапки.
- `show/hide/snap` идемпотентны по цели (`isNewBarTarget`): повтор той же команды не
  перезапускает идущую анимацию. После `shift` и перемера цель сбрасывается в `NaN`.
- `screenListeners` — для `screenListeners` навигатора: на focus/blur панель
  показывается, чтобы скрытая шапка одного экрана не осталась скрытой над другим.
- Чистая геометрия (`bar-visibility.ts`, `bar-scroll-edge.ts`) покрыта тестами.

## Зависимости

- `react-native-reanimated`, `react-native-worklets` (`scheduleOnUI`).
- Потребители: `shared/ui/navbar` (`NavbarProvider`, `HiddenBar`, `ImageBar`,
  `useNavbarScrollSync`), `widgets/app-shell` (таб-бар), `shared/lib/search`.
