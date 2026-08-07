# react-native-ocr-engine

Универсальный Nitro-модуль on-device OCR для VisionCamera v5: читает любой
текст кадра и ничего не знает о предметной области. Синхронный
`scan(frame, options)` вызывается из frame-worklet'а камеры (через
`NitroModules.box`) и возвращает текстовые области кадра в нормализованных
координатах выпрямленного изображения.

- **iOS** — Apple Vision (`VNRecognizeTextRequest`) + опциональный
  CoreML-детектор регионов интереса (`<name>.mlmodelc` в бандле).
- **Android** — ML Kit Text Recognition + опциональный TFLite-детектор
  (`<name>.tflite` в assets), YOLO-декодер и NMS — в `YoloRegionDetector`.

Детектор — любая YOLO-модель регионов, экспортированная в CoreML (NMS
встроен) / TFLite; загружается через `loadDetector(name)`, без модели
работает полнокадровый OCR.

Кодогенерация спек (после правок `src/specs/*.nitro.ts`):

```bash
cd modules/react-native-ocr-engine
npx nitrogen@0.36.5
```

Вся предметная логика (домены) намеренно живёт в JS приложения и меняется
без пересборки нативной части: универсальный пайплайн —
`@shared/lib/ocr-scan` (`IOcrScanDomain`), домены — `@shared/lib/container-ocr`
(ISO 6346), `@shared/lib/plate-ocr` (автономера РФ), произвольный текст —
`features/text-scan`.
