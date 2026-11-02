---
module: features/container-scan
summary: Сканер кодов морских контейнеров ISO 6346 — OCR-домен с детектором областей, типоразмер и веса.
---

# container-scan

Распознаёт код контейнера с контрольной цифрой, параллельно собирает типоразмер и веса с
табличек. Камера и пайплайн — общий `OcrScanCamera`, здесь только домен и состояние экрана.

## Public API

| Экспорт                                                              | Что                                                                        |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `useContainerScanVM`, `IContainerScanVM`, `IUseContainerScanVMProps` | разрешение камеры, фонарик, `result`, `restartScan`; колбэк `onRecognized` |
| `ContainerScanCamera`, `IContainerScanCameraProps`                   | камера: `vm`, `isActive`, `style`                                          |
| `IContainerScanResult`                                               | код, части ISO 6346, линия-владелец, атрибуты, size-type                   |
| `buildScanResult`                                                    | кандидат + атрибуты → результат (`null`, если код не разобрался)           |
| `CONTAINER_SCAN_DOMAIN`                                              | OCR-домен для `OcrScanCamera`                                              |

## Устройство

- `model/container-scan-domain.ts` — `createOcrDomain`: подтверждение за 3 скана
  (`confirmStreak`) плюс межкадровое накопление голосов (`accumulateCandidates`); детектор
  `container_code_detector` с регионами номер / тип / брутто / тара / нетто, по одному на класс.
  Без модели детектора области кадра разбираются целиком.
- Типоразмер и веса ждутся до 30 кадров после подтверждения кода, затем результат отдаётся
  неполным.
- `suspendOnConfirm: false` — оверлей обновляется и после подтверждения; колбэк подтверждения
  одноразовый до `resume()` (`restartScan`).
- `model/useContainerScanVM.ts` — проверка `isValidIso6346`, хаптик, `onRecognized`. Сканер
  камеры хранится по ссылке (`attachScanner`): frame-пайплайн создаётся заново на каждый маунт.

## Зависимости

- `@shared/lib/container-ocr`, `@shared/lib/ocr-scan`, `@shared/ui` (`OcrScanCamera`),
  `react-native-vision-camera`, `react-native-haptic-feedback`.
- Используется: `pages/stack/container-scanner`.

## Gotcha

- `setResult` в `handleCandidateConfirmed` закомментирован: `result` всегда `null`, камера не
  останавливается, результат получает только `onRecognized` (в странице закомментировано и
  закрытие шторки).
- Функции домена — worklet'ы: вызываемая функция объявляется выше вызывающей, RegExp — только
  внутри тел функций.
