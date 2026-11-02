---
module: shared/lib/keyboard
summary: Покадровая высота клавиатуры на UI-потоке — низкоуровневый источник для компенсаций, без знания о safe area и панелях.
---

# keyboard

Сырая высота клавиатуры, включая интерактивное закрытие свайпом. Перекрытие
(safe area, панель ввода, шторка) собирают по месту использования.

## Public API

| Экспорт             | Что                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `useKeyboardHeight` | `IKeyboardHeight`: `height`, `targetHeight` (shared values), `isVisible()`, `getHeight()` |
| `IKeyboardHeight`   | контракт                                                                                  |

## Устройство

- Подписка через `useKeyboardHandler` keyboard-controller: `onStart` пишет
  `targetHeight` и запускает `withTiming` к ней на длительность анимации клавиатуры,
  `onMove`/`onInteractive`/`onEnd` пишут высоту кадра напрямую.
- `targetHeight` известна из `onStart` — до начала анимации.
- `isVisible`/`getHeight` — синхронное чтение из JS: JS-зеркало обновляется через
  `scheduleOnRN`.

## Зависимости

- `react-native-keyboard-controller`, `react-native-reanimated`,
  `react-native-worklets`.
- Потребители: `shared/ui/input-bar` (`useInputBarInset`), `shared/ui/bottom-sheet`
  (`useSheetKeyboardLayout`, `BottomSheetLayout`). Поля форм над клавиатурой в скролле —
  отдельный модуль `shared/lib/keyboard-aware`.

## Gotcha

- Каждый вызов хука — своя подписка на клавиатуру: на экран с несколькими
  потребителями высоту поднимают в одно место (как `useInputBarInset`).
