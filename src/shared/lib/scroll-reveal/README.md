---
module: shared/lib/scroll-reveal
summary: Переход содержимого при уходе якоря за верх скролла (например, в шапку) — контроллер прогресса, якорь и контекст скролла экрана.
---

# scroll-reveal

Прогресс 0…1 ухода якоря за верхний край видимой области скролла: по нему шапка
показывает компактный заголовок, а якорь гаснет. Контроллер создаётся где угодно
(страница с навбаром, опции навигатора), к скроллу его привязывает якорь.

## Public API

| Экспорт                                                                      | Что                                                                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `useScrollReveal({ start, end, distance }?)`                                 | `IScrollReveal`: `progress` (SharedValue), `range`, `scrollToTop`, `bind`                             |
| `useScrollRevealAnchor(reveal, content?)`                                    | якорь → `{ ref, onLayout }`; привязывает контроллер и ведёт `progress`                                |
| `ScrollContentContext`, `useScrollContent`, `IScrollContent`                 | скролл экрана для содержимого: телеметрия, `contentRef`, `topInset`, `subscribeLayout`, `scrollToTop` |
| `revealProgress`, `resolveRevealRange`, `subProgress`, `IRevealRangeOptions` | чистая математика (worklet, тесты)                                                                    |

## Устройство

- Участок перехода — доли высоты якоря: `start` 0.3, `end` 1; `distance` — путь в px от
  `start` вместо `end` (для якорей переменной высоты).
- Якорь меряется `measureLayout` относительно `contentRef` — при своей раскладке и при
  раскладке контента (`subscribeLayout`); `progress` пересчитывается реакцией от
  `offsetY + topInset` без замеров на кадре.
- Контекст даёт `ScreenScroll`; вне его скролл передаётся вторым аргументом.
- Готовые UI-части — `shared/ui/reveal` (`ScrollRevealAnchor`, `RevealView`) и
  `NavbarReveal`/`useNavbarReveal` в `shared/ui/navbar`.

## Зависимости

- `shared/lib/animation` (`TAnimatedNumber`), `shared/lib/scroll` (`IScrollValues`),
  `react-native-reanimated`.
- Потребители: `shared/ui` (`ScreenScroll`, `reveal`), `widgets/app-menu`,
  `pages/tabs/settings`, демо плейграунда.

## Gotcha

- Хук якоря вызывается в потомке `ScreenScroll`, а не в компоненте, который его рендерит:
  иначе контекста скролла ещё нет.
