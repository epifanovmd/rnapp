---
module: shared/lib/object-scan
summary: Сканер объектов камеры — детекция моделью на worklet-потоке, боксы для оверлея и троттлящийся поток объектов в JS.
---

# object-scan

Frame-пайплайн детекции объектов на том же ядре, что OCR-сканер
([shared/lib/ocr-scan](../ocr-scan/README.md)): модель из папок моделей приложения,
классы — из её метаданных, подписи — по имени класса.

## Public API

| Экспорт                                    | Что                                                                                                        |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `useObjectScanner(props)`                  | `IObjectScanner`: `frameOutput`, `overlay`, `isModelLoaded`, `modelInfo`, `pause`, `resume`, `diagnostics` |
| `IUseObjectScannerProps`, `IObjectScanner` | контракты хука                                                                                             |
| `IDetectedObjectInfo`                      | объект для JS: `classIndex`, `className`, `label`, `score`                                                 |

Пропсы: `model` (`DetectorModelConfig`), `titles` (подписи по имени класса), `classes`
(какие классы показывать; не задано — все), `minScore` (0.4), `maxObjects` (8),
`onDetections`, `onError`.

## Устройство

- Кадр: `openFrame` → `detect` → `selectObjects` (фильтр классов и лимит, чистая
  функция, тест) → боксы `kind: "region"` в `publishOverlay` → `onDetections` не чаще
  раза в 300 мс.
- Подпись объекта: заданная в `titles`, иначе имя класса модели, без имени — `#<индекс>`.
- `isModelLoaded`: `null` — модель грузится, `false` — не найдена или несовместима;
  пока модель не готова или сканер на паузе, кадры пропускаются.
- `model` сравнивается по значению (`JSON.stringify`): литерал у потребителя не
  перезагружает модель.

## Зависимости

- `shared/lib/ocr-scan` (примитивы frame-пайплайна), `shared/lib/scan-overlay`,
  `react-native-vision-engine`, `react-native-vision-camera`, `react-native-worklets`.
- Потребитель: `features/object-scan`.
