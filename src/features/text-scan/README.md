---
module: features/text-scan
summary: Распознавание произвольного текста камерой — живой поток строк в порядке чтения.
---

# text-scan

OCR без кандидатов и подтверждения: камера стримит распознанные области, VM держит строки
последнего непустого скана.

## Public API

| Экспорт                                  | Что                                                       |
| ---------------------------------------- | --------------------------------------------------------- |
| `useTextScanVM`, `ITextScanVM`           | `lines`, `clearLines`, `camera`                           |
| `ITextScanCameraVM`                      | часть VM для камеры: колбэк областей, фонарик, разрешение |
| `TextScanCamera`, `ITextScanCameraProps` | камера: `vm` (`ITextScanCameraVM`), `isActive`, `style`   |
| `TEXT_SCAN_DOMAIN`                       | OCR-домен без кандидатов                                  |

## Устройство

- `model/text-scan-domain.ts` — `extractCandidates` всегда пуст; строки уходят в JS через
  `onObservations`.
- `model/reading-order.ts` — `toReadingOrder`: сверху вниз, в строке слева направо; области
  группируются в строку от её верхней области (порог 0.02), порядок не зависит от входа.
- `model/same-lines.ts` — одинаковые строки не обновляют состояние.
- `TextScanCamera` подписывает каждую OCR-область распознанным текстом (`OverlayLabels`).
- Тесты — `model/__tests__/{reading-order,same-lines}.test.ts`.

## Зависимости

- `@shared/lib/ocr-scan`, `@shared/ui` (`OcrScanCamera`, `OverlayLabels`),
  `react-native-vision-camera`.
- Используется: `pages/stack/text-scanner`.

## Gotcha

- `camera` — отдельный стабильный объект: в камеру передаётся он, а не вся VM, иначе каждый
  новый текст перерисовывал бы камеру.
- Пустой скан не очищает `lines` — показываются строки последнего непустого.
