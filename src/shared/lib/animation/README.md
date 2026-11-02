---
module: shared/lib/animation
summary: Анимационные примитивы над shared values — интерполяция источника в диапазон и тип «число или shared value».
---

# animation

Мелкие примитивы Reanimated, общие для скролл-поведений, панелей и отступов.

## Public API

| Экспорт                | Что                                                                        |
| ---------------------- | -------------------------------------------------------------------------- |
| `useInterpolatedValue` | `(source, inputRange, outputRange, extrapolation = CLAMP)` → derived value |
| `TAnimatedNumber`      | `number \| SharedValue<number>` — отступ, статичный или анимируемый        |
| `readAnimatedNumber`   | текущее значение `TAnimatedNumber`; worklet — читается и на UI-потоке      |

## Устройство

- `useInterpolatedValue` работает поверх любого `SharedValue` (офсет скролла, offset
  панели, прогресс жеста); прогресс 0..1 — тот же хук с выходом `[0, 1]`.
- Диапазоны сравниваются по содержимому (`join()` в зависимостях): литерал-массив в
  аргументе не пересоздаёт derived value на каждом рендере.

## Зависимости

- `react-native-reanimated`.
- Потребители: `shared/lib/keyboard-aware`, `shared/lib/scroll-reveal`, `shared/ui`
  (`ImageBar`, `RefreshIndicator`, `ScreenScroll`, `KeyboardAwareScrollView`,
  `SearchOverlay`).
