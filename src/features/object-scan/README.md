---
module: features/object-scan
summary: Пример детекции объектов камерой — боксы на оверлее и живой список найденного.
---

# object-scan

Чистая детекция объектов без OCR: модель `object_detector`, боксы с русскими подписями
классов на Skia-оверлее, список объектов последнего скана в VM.

## Public API

| Экспорт                                      | Что                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `useObjectScanVM`, `IObjectScanVM`           | `detections` (по убыванию уверенности), `clearDetections`, `camera` |
| `IObjectScanCameraVM`                        | часть VM для камеры: колбэк детекций, фонарик, разрешение           |
| `ObjectScanCamera`, `IObjectScanCameraProps` | камера: `vm` (`IObjectScanCameraVM`), `isActive`, `style`           |

## Устройство

- `ui/ObjectScanCamera.tsx` — `useObjectScanner({ model, titles, onDetections })` +
  `ScanCameraShell` + `ScanOverlay`; в dev — `ScanDiagnosticsBadge`.
- `model/object-detector.ts` — конфиг модели; `model/object-class-titles.ts` — подписи классов
  по имени из метаданных модели (класс без подписи показывается своим именем).
- `model/useObjectScanVM.ts` — пустой скан не сбрасывает `detections`; `camera` — отдельный
  стабильный объект, новые детекции камеру не перерисовывают.

## Зависимости

- `@shared/lib/object-scan`, `@shared/lib/theme`, `@shared/ui` (`ScanCameraShell`,
  `ScanOverlay`, `OverlayLabels`, `ScanDiagnosticsBadge`), `react-native-vision-camera`.
- Используется: `pages/stack/object-scanner`.

## Gotcha

- Модель кладётся вручную в `ios/MLModels` и `android/app/src/main/assets`; без неё камера
  показывает подсказку «Модель … не найдена» (`isModelLoaded === false`).
