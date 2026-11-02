# react-native-vision-engine

Универсальный Nitro-модуль зрения для VisionCamera v5: примитивы детекции и
OCR над кадром, предметной области не знает. Порядок операций, отбор
регионов и разбор результата задаёт JS в frame-worklet'е — новая модель или
новый сценарий (двухэтапная детекция, OCR по рамке, разные параметры на
регион) не требуют правок нативного слоя.

## API

- `loadModel(config)` — загрузить модель детекции в реестр движка (по
  `config.name`). `DetectorModelConfig`:
  - `name` — имя файла модели без расширения;
  - `labels` — имена классов, если модель их не содержит;
  - `resize` — `letterbox` (пропорции + поля 114) или `stretch`;
  - `boxUnits` — единицы координат выхода: `auto`, `normalized`, `pixels`;
  - `accelerator` / `threads` — вычислитель и потоки инференса (Android;
    недоступный делегат заменяется CPU).

  Возвращает `DetectorModelInfo`: `loaded`, имена классов (из метаданных
  модели или конфига), число классов, размер входа.

- `openFrame(frame)` → `FrameSession` — подготовленный кадр (выпрямление и
  буферы — один раз на сессию). Методы синхронные, для frame-worklet'а:
  - `detect(model, {minScore, iouThreshold?, maxResults?})` — детекции
    загруженной модели по убыванию score: бокс, score, индекс и имя класса;
  - `recognize(rois, {mode, minConfidence, maxObservations?, languages?, minRoiSizePx?})`
    — OCR областей одним проходом; `result[i]` — текст `rois[i]`
    (`{read, observations}`; `read: false` — область меньше
    `minRoiSizePx`). Полный кадр — область `{x: 0, y: 0, width: 1, height: 1}`;
  - `width` / `height` — размеры выпрямленного кадра;
  - `dispose()` — освободить кадр; вызывается до `frame.dispose()`.

Все координаты — нормализованные [0..1] top-left выпрямленного кадра.
Рантайм-источник дефолтов — экспорт `VISION_ENGINE_DEFAULTS`; нативные
фолбэки совпадают с ним.

```ts
const session = engine.openFrame(frame);
try {
  const regions = session.detect("detector", { minScore: 0.35 });
  const texts = session.recognize(
    regions.map(region => ({ rect: region.rect, padding: 0.1 })),
    { mode: "accurate", minConfidence: 0.25 },
  );
  // texts[i] — текст regions[i]
} finally {
  session.dispose();
}
```

## Модели

CoreML (`ios/MLModels/*.mlpackage`) и TFLite (`android assets/*.tflite`).
Формат выхода определяется по размерности тензора: классический
`[1, 4 + nc, N]` (NMS внутри класса выполняет модуль) или end-to-end
`[1, N, 6]`; CoreML-модель может также содержать встроенный NMS. Имена
классов читаются из метаданных модели (`names`): у CoreML — пользовательские
метаданные или метки классификатора, у TFLite — `metadata.json` в
zip-архиве в хвосте файла. Android принимает float32 и квантованные
uint8/int8 вход и выход.

Реестр моделей — per-instance (`createVisionEngine` — по движку на
сканер), сами модели кэшируются нативно на время жизни приложения:
повторные загрузки дёшевы и ничего не перечитывают.

## Структура нативного слоя

Один файл — одна ответственность, платформа зеркалит платформу;
`HybridVisionEngine` и `HybridFrameSession` — тонкие фасады nitro-спеки.

| Ответственность              | iOS (`ios/`)                 | Android (`.../visionengine/`) |
| ---------------------------- | ---------------------------- | ----------------------------- |
| Фасад спеки (реестр моделей) | `HybridVisionEngine.swift`   | `HybridVisionEngine.kt`       |
| Сессия кадра                 | `HybridFrameSession.swift`   | `HybridFrameSession.kt`       |
| Загрузка моделей             | `CoreMLModelLoader.swift`    | `TfliteModelLoader.kt`        |
| Метаданные модели (чистые)   | `ModelMetadata.swift`        | `ModelMetadata.kt`            |
| Модель + конфиг прогона      | `CoreMLObjectDetector.swift` | `DetectorSlot.kt`             |
| Прогон модели                | `FrameLetterbox.swift`       | `TfliteDetector.kt`           |
| Декодер выхода (чистый)      | `YoloOutputDecoder.swift`    | `YoloOutputDecoder.kt`        |
| OCR-движок                   | `VisionTextRecognizer.swift` | `MlKitTextRecognizer.kt`      |
| Геометрия кадра              | `FrameGeometry.swift`        | `FrameGeometry.kt`            |
| Регистрация в RN             | автолинкинг пода             | `VisionEnginePackage.kt`      |

Чистые компоненты Android покрыты JVM-тестами
(`android/src/test`, `./gradlew :react-native-vision-engine:testDebugUnitTest`
из `android/` приложения).

Кодогенерация спек (после правок `src/specs/*.nitro.ts`; затем
`pod install`):

```bash
cd modules/react-native-vision-engine
npm run specs
```

`specs` после nitrogen запускает `scripts/strip-struct-equality.cjs`: он
убирает `operator== = default` из сгенерированных структур с полями-векторами.
Иначе Swift 6.2 (Xcode 26) теряет соответствие `std::vector` коллекции Swift, и
сгенерированный код не компилируется. Скрипт убирается, когда исправление
выйдет в Swift или Nitro (margelo/nitro#1186).

Вся предметная логика живёт в JS приложения и меняется без пересборки
нативной части: стандартный OCR-конвейер «детекция → отбор регионов → OCR»
и домены — `@shared/lib/ocr-scan` (`runOcrPipeline`, `IOcrScanDomain`),
детекция объектов — `@shared/lib/object-scan`; предметные разборщики —
`@shared/lib/container-ocr` (ISO 6346), `@shared/lib/plate-ocr`
(автономера РФ), произвольный текст — `features/text-scan`.
