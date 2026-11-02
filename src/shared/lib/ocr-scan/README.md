---
module: shared/lib/ocr-scan
summary: Универсальный OCR-сканер кадра камеры — конвейер детекция → отбор регионов → чтение, доменная стабилизация и примитивы frame-пайплайна.
---

# ocr-scan

JS-часть сканеров поверх нативного модуля `react-native-vision-engine` и VisionCamera:
конвейер кадра на worklet-потоке камеры, отбор регионов детектора, контракт домена
распознавания и общие примитивы, на которых построены и OCR-, и объектный сканеры.
Предметную логику (что читать и как валидировать) задаёт домен.

## Public API

| Экспорт                                                                                                                                                                | Что                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `useOcrScanner({ domain, mode?, fullFrameFallback?, regions?, onCandidateConfirmed?, onObservations?, onError? })`                                                     | `IOcrScanner`: `frameOutput`, `overlay`, `resume`, `diagnostics`, `detectorInfo` |
| `createOcrDomain(config)`, `IOcrDomainConfig`                                                                                                                          | домен из частичного конфига; обязателен только `extractCandidates`               |
| `IOcrScanDomain`, `IOcrScanFrame`, `IOcrScanRegion`, `IOcrScanCandidate`, `IOcrScanDetectorConfig`, `IOcrScanRegionConfig`, …                                          | контракты (`types.ts`)                                                           |
| `runOcrPipeline(session, config)`                                                                                                                                      | worklet-конвейер кадра                                                           |
| `buildOcrPipelineConfig`, `resolveModelConfig`, `buildRegionTitles`, `findMissingRegions`                                                                              | сборка конфига конвейера (чистые, тесты)                                         |
| `selectRegions`, `decodeThreshold`                                                                                                                                     | отбор регионов: правила, квоты, отступы                                          |
| `collectCandidates`, `regionsOf`, `regionObservations`, `frameObservations`, `hasDetectorRegions`                                                                      | хелперы доменов над кадром (`frame.ts`)                                          |
| `getWorkletEngine`, `shouldEmit`, `publishOverlay`, `useOverlayChannel`, `usePreviewOrientation`, `useScannerInstanceKey`, `useStableCallback`, `useVisionFrameOutput` | примитивы frame-пайплайна                                                        |
| `OCR_SCAN_DEFAULTS`, `REGION_DEFAULTS`, `FULL_FRAME_RECT`                                                                                                              | дефолты распознавания и отбора                                                   |
| `previewOrientationDelta`, `toPreviewRect`, `swapsFrameSides`                                                                                                          | перевод координат кадра в координаты превью                                      |

## Устройство

- Кадр: `openFrame` → `runOcrPipeline` (detect → `selectRegions` → один `recognize` по
  кропам) → `session.dispose()` → домен извлекает кандидатов и атрибуты →
  `publishOverlay` → стабилизация → `frame.dispose()`.
- Полный кадр читается без детектора либо при `fullFrameFallback`, когда регионы не
  дали текста. Детектор входит в конфиг только после успешного `loadModel`; общий лимит
  регионов по умолчанию — сумма квот объявленных регионов.
- Подтверждение: серия из `confirmStreak` одинаковых валидных кандидатов или
  `resolveAccumulated` домена; `isComplete` откладывает его до готовности атрибутов.
  `suspendOnConfirm` (по умолчанию) останавливает обработку до `resume()`.
- `collectCandidates` извлекает по каждому региону отдельно — текст разных регионов не
  смешивается; без регионов — по полному кадру; одинаковые значения сливаются,
  валидные первыми.
- Движок — свой на каждый сканер (`createBoxedVisionEngine`), worklet-кэш движка и
  ключи троттлинга — в пространстве имён `useScannerInstanceKey`.
- Оверлей публикуется в координатах превью: кадры выпрямлены по ориентации устройства,
  превью — по ориентации интерфейса, разницу держит `usePreviewOrientation`. Доменные
  rect'ы остаются в координатах кадра.
- `onObservations`, `onError` и dev-диагностика троттлятся; диагностика — только в
  `__DEV__`, без `onError` — `console.warn`.

## Зависимости

- `shared/lib/scan-overlay`, `react-native-vision-engine`, `react-native-vision-camera`,
  `react-native-worklets`, `react-native-nitro-modules` (типы).
- Потребители: `shared/lib/object-scan`, `shared/lib/container-ocr`,
  `shared/lib/plate-ocr`, `shared/ui/scan` (`OcrScanCamera`, `ScanDiagnosticsBadge`),
  `features/{container-scan,plate-scan,text-scan}`.

## Gotcha

- Сессия кадра действительна, пока жив `Frame`: `session.dispose()` — до
  `frame.dispose()`.
- Worklet захватывает только функции, объявленные выше по модулю: вызов объявленной
  ниже падает в рантайме камеры. RegExp из module scope не сериализуется в
  worklet-рантайм — литералы только внутри тел функций.
- Ключ `shouldEmit` обязан включать префикс экземпляра (`"ocr#1:texts"`), иначе
  сканеры делят лимит.
- `useVisionFrameOutput` — буферы размера превью: иначе cover-маппинг оверлея не
  совпадёт с превью. Frame-output создаётся на каждый маунт камеры — перенос между
  сессиями роняет AVFoundation.
- В jest `react-native-vision-engine` замаплен на заглушку с одними
  `VISION_ENGINE_DEFAULTS`.
