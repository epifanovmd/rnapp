# react-native-vision-engine

Универсальный Nitro-модуль зрения для VisionCamera v5: on-device OCR
(`scan`) и детекция объектов (`detectObjects`), предметной области не
знает. Оба метода синхронные — вызываются из frame-worklet'а камеры
(через `NitroModules.box`) и возвращают результат в нормализованных
top-left координатах выпрямленного изображения.

## API

- `scan(frame, options)` — текстовые области кадра (iOS — Apple Vision,
  Android — ML Kit); с загруженным детектором читает только регионы
  интереса, без детектора — полнокадрово. Опция `fullFrameFallback`
  (по умолчанию `false`) разрешает дочитать полный кадр, когда кропы
  детектора не дали текста.
- `loadDetector(name)` — детектор регионов для OCR-пути (опционален).
- `loadObjectModel(name)` / `detectObjects(frame, options)` — отдельный
  слот модели детекции объектов: боксы + score + класс (`classIndex`;
  CoreML-пайплайн дополнительно отдаёт `label` из модели).
- `scan(...).regions` — регионы детектора, использованные для наведения
  OCR (та же форма `DetectedObject`, что у `detectObjects`).
- `analyze(frame, {ocr?, objects?})` — комбинированный проход с общей
  подготовкой кадра (на Android — один upright-битмап на обе секции);
  для одиночных сценариев предпочтительны `scan`/`detectObjects`.

Модели — YOLO в CoreML (`ios/MLModels/*.mlpackage`) / TFLite
(`android assets/*.tflite`); поддерживаются оба поколения формата выхода
с автоопределением по размерности тензора: классический `[1, 4+nc, N]`
(v8/11/12, NMS на нашей стороне или встроен в CoreML-пайплайн) и
end-to-end `[1, N, 6]` (v10/26).

## Структура нативного слоя

Один файл — одна ответственность, платформа зеркалит платформу;
`HybridVisionEngine` — тонкий фасад nitro-спеки, только оркестрация.

| Ответственность | iOS (`ios/`) | Android (`.../visionengine/`) |
|---|---|---|
| Фасад спеки | `HybridVisionEngine.swift` | `HybridVisionEngine.kt` |
| Загрузка моделей | `CoreMLModelLoader.swift` | `TfliteModelLoader.kt` |
| Декодер YOLO-выходов (чистый) | `YoloOutputDecoder.swift` | `YoloOutputDecoder.kt` |
| Прогон детекции | `CoreMLObjectDetector.swift` | `TfliteDetector.kt` |
| OCR-движок | `VisionTextRecognizer.swift` | `MlKitTextRecognizer.kt` |
| Геометрия кадра | `FrameGeometry.swift` | `FrameGeometry.kt` |
| Регистрация в RN | автолинкинг пода | `VisionEnginePackage.kt` |

Кодогенерация спек (после правок `src/specs/*.nitro.ts`):

```bash
cd modules/react-native-vision-engine
npx nitrogen@0.36.5
```

Вся предметная логика (домены) намеренно живёт в JS приложения и меняется
без пересборки нативной части: универсальный пайплайн —
`@shared/lib/ocr-scan` (`IOcrScanDomain`) и `@shared/lib/object-scan`,
домены — `@shared/lib/container-ocr` (ISO 6346), `@shared/lib/plate-ocr`
(автономера РФ), произвольный текст — `features/text-scan`.
