---
name: Native Modules (iOS & Android)
description: Нативные модули; keyboard compensation
type: project
---

## Нативные модули

- **WheelPicker** (`RNWheelPicker`) — колесо выбора на обеих платформах, один нативный вью =
  одна колонка. Единый API — спека `shared/ui/picker/native/NativeWheelPickerSpec.ts`.
  iOS: `ios/Picker/` — Swift/UIKit, `UICollectionView` + кастомный `UICollectionViewFlowLayout`
  (цилиндрическая развёртка в `transform3D`), снап в `scrollViewWillEndDragging`.
  Android: `rnwheelpicker/` — Kotlin, `RecyclerView` + `LinearSnapHelper`, изгиб —
  `rotationX/scale/alpha` детей, прокрутку ограничивает `ClampingLayoutManager`.
  Возможности: `disabled`-элементы с жёстким упором прокрутки (`stopAtDisabled`),
  бесконечная прокрутка (`loop`), события `onChange`/`onScrollStateChange`/`onScroll`,
  команда `scrollToIndex`, стилизация текста, индикатора (`lines|box|fill`) и шторки.
- **AppSplash** — свой нативный splash-экран (библиотека `react-native-bootsplash` убрана).
  Android: `com/rnapp/appsplash/` (Kotlin) — тема запуска `BootTheme` (`values/styles.xml` +
  `values-v31/`), до Android 12 картинку рисует `drawable/splash_compat.xml`, с 12 — системный
  SplashScreen API; после старта activity поверх окна остаётся `AppSplashView`, он убирается по
  `hide()` из JS. iOS: `ios/AppSplash/` (Swift) — сториборд `Splash.storyboard` инстанцируется
  повторно поверх RN-контента. JS: `@shared/lib/splash` → `AppSplash.hide({ fade })`.
  Ассеты (логотип, бренд, светлая/тёмная темы) генерируются `npm run splash` из
  `splash.config.mjs` скриптом `scripts/splash/` (sharp): Android — `drawable-*`,
  `drawable-night-*`, `values*/colors.xml`; iOS — xcassets + сториборд.
- **VisionEngine** (`template/modules/react-native-vision-engine`) — локальный Nitro-модуль
  (link:-зависимость в package.json, symlink в node_modules): универсальный on-device OCR для
  **VisionCamera v5** (Nitro-архитектура, `useFrameOutput` + `react-native-vision-camera-worklets`),
  предметной области не знает — домены в JS.
  Спека `src/specs/VisionEngine.nitro.ts` (кодоген: `npx nitrogen@0.36.5`, генерат закоммичен в
  `nitrogen/generated/`), принимает `Frame` VisionCamera как внешний nitro-тип.
  iOS: `ios/HybridVisionEngine.swift` — `VNRecognizeTextRequest` + опц. CoreML-детектор регионов
  (`ios/MLModels/container_code_detector.mlpackage`, synchronized group в pbxproj).
  Android: Kotlin — ML Kit text-recognition + опц. TFLite YOLO-детектор
  (`android/app/src/main/assets/container_code_detector.tflite`), `YoloRegionDetector` — декодер+NMS;
  cast `frame as NativeFrame` → `ImageProxy`. `scan` синхронный, вызывается из frame-worklet'а
  через `NitroModules.box`/`unbox`. Модели детекторов (YOLO → CoreML со
  встроенным NMS либо сырым тензором / TFLite) кладутся в приложение вручную
  (`ios/MLModels/`, `android/.../assets/`); без модели OCR работает
  полнокадрово. Классы модели привязываются по `classIndex` — порядок
  классов при обучении обязан совпадать с доменом.
  Нативный слой разбит по SRP, платформы зеркальны (таблица — README модуля):
  фасад `HybridVisionEngine` + `{CoreML,Tflite}ModelLoader` + чистый
  `YoloOutputDecoder` + `{CoreMLObjectDetector,TfliteDetector}` +
  `{VisionTextRecognizer,MlKitTextRecognizer}` + `FrameGeometry`.
  JS-архитектура мультидоменная: примитивы кадрового конвейера —
  `shared/lib/ocr-scan/use-frame-pipeline` (`getWorkletEngine`, `shouldEmit`,
  `publishOverlay`, `useOverlayChannel`, `useStableCallback`,
  `useVisionFrameOutput`) — на них построены `useOcrScanner`
  (параметризуется `IOcrScanDomain`) и `useObjectScanner`. UI-каркас камеры —
  `shared/ui/scan/ScanCameraShell` (девайс, разрешения, фонарик,
  заглушки; конвейер и оверлеи — через `outputs`/`children`), поверх него
  `OcrScanCamera` (проп `overlayLayers` — доп. слои оверлея) и фичевые камеры. Frame-output создаётся на каждый маунт:
  переиспользование между сессиями роняет AVFoundation. Домены: `shared/lib/container-ocr` (ISO 6346: контрольная
  цифра, перебор OCR-подстановок, веса/типоразмер), `shared/lib/plate-ocr`
  (РФ-номера: формат ГОСТ, латинско-кириллические подстановки). Фичи-обвязки:
  `features/container-scan`, `features/plate-scan`, `features/text-scan`
  (произвольный текст через `onObservations`). Детекция объектов: методы
  `loadObjectModel`/`detectObjects` (отдельный слот модели `object_detector`,
  декодеры classic+end-to-end YOLO с classIndex/label), ядро —
  `shared/lib/object-scan` (`useObjectScanner`, COCO-метки), пример —
  `features/object-scan` + `pages/stack/object-scanner`. `scan(...).regions` —
  детекции наведения OCR (та же форма `DetectedObject`);
  `analyze(frame, {ocr?, objects?})` — комбинированный проход с общим
  upright-битмапом (Android). Оверлей — хост + слои:
  `shared/lib/scan-overlay` — данные (типы `IScanOverlayBox`
  `{rect, kind: text|candidate|valid|region, label?}`, cover-маппинг,
  сглаживание); `shared/ui/scan/overlay/` — `ScanOverlayHost` (опрос
  Synchronizable на UI-потоке, анти-мигание, маппинг в пиксели один раз,
  слои-children получают `IScanOverlayApi` render-prop'ом, не контекстом),
  слои `OverlayFrames` (рамки/уголки категории), `OverlayLabels` (подписи
  SkPicture: метка класса / значение кандидата из `label`), `OverlayDim`
  (затемнение вне боксов, even-odd), хук `useOverlayPath` для своей
  геометрии; `ScanOverlay` — стандартный пресет (регион — синие уголки).
  Системы координат: кадры frame-output выпрямляются по ориентации
  устройства (`orientationSource="device"` у `CameraView` — распознавание
  получает изображение, выпрямленное по гравитации), превью на обеих
  платформах ориентацию выхода игнорирует и всегда идёт по ориентации
  интерфейса. Разницу держит `usePreviewOrientation`
  (`previewOrientationDelta`), `publishOverlay` доворачивает боксы и
  меняет стороны кадра — оверлей публикуется уже в координатах превью,
  доменные rect'ы остаются в выпрямленных.
  Экраны с BottomSheet-камерой —
  `pages/stack/{container,plate,text,object}-scanner`.
  Движки — per-scanner (`createVisionEngine`/`createBoxedVisionEngine`,
  `useScannerInstanceKey` — namespaced worklet-кэш и ключи троттлинга);
  модели кэшируются нативно по имени на всё приложение (iOS
  `CoreMLModelLoader`, Android `TfliteDetector.load`), слоты фасадов
  потокобезопасны (NSLock / @Volatile). Пороги детектора — опциональные
  поля `OcrScanOptions`/`ObjectScanOptions`, рантайм-источник дефолтов —
  `DETECTOR_DEFAULTS` модуля (нативные фолбэки совпадают). Android подаёт
  кадр letterbox'ом (поля 114, обратный пересчёт координат), iOS —
  `scaleFill` (конвенция ultralytics-CoreML); TFLite-буферы прогона
  переиспользуются, `detect` synchronized. iOS OCR по регионам — батч
  запросов одним `VNImageRequestHandler`. Покадровые шаги OCR-конвейера —
  worklet-хелперы `shared/lib/ocr-scan/ocr-worklets`; домены создаются
  фабрикой `createOcrDomain(partial)` и целиком описывают свой конвейер:
  `detector` (`modelName`, `classLabels`, `classes`, `minScore`,
  `maxRegions`, `maxRegionsPerClass`, `padding`, `iouThreshold`) и
  `recognition` (`mode`, `minConfidence`, `maxObservations`,
  `fullFrameFallback`); пропы `OcrScanCamera` перекрывают режим точечно,
  незаданное берётся из `OCR_SCAN_DEFAULTS`/`DETECTOR_DEFAULTS`.
  Многоклассовые детекторы: `OcrObservation.regionClassIndex` — класс
  региона, из кропа которого прочитан текст (-1 = полный кадр,
  `FULL_FRAME_REGION_CLASS`); домен раскладывает области хелпером
  `selectByRegionClass` (без размеченных классов возвращает все — работа
  без модели не ломается). NMS подавляет только внутри класса, отбор
  регионов — квота на класс плюс общий лимит. Контейнерный детектор —
  3 класса (`CONTAINER_REGION_CLASSES`: 0 код, 1 типоразмер, 2 веса);
  веса разбираются по меткам таблички, а при их отсутствии — по
  тождеству брутто = тара + нетто (килограммовая тройка предпочитается
  фунтовой); после подтверждения кода домен ждёт типоразмер и веса
  ограниченное число кадров и отдаёт результат с тем, что прочиталось. Сканеры отдают `onError`
  (троттлится) и dev-диагностику (`durationMs`/`detectorUsed`,
  `ScanDiagnosticsBadge`, только `__DEV__`); `useObjectScanner` имеет
  `pause`/`resume`. Юнит-тесты чистой логики — jest
  (`npm test`, `jest.config.js` + `babel-jest.config.js` без
  Reanimated-плагина): iso6346, container-candidates, `toUprightRect`,
  cover-маппинг, сглаживание.
  Важно worklet'ам: worklet захватывает в замыкание только функции,
  объявленные ВЫШЕ по модулю — вызов объявленной ниже падает в рантайме
  камеры как «undefined is not a function»; общий хелпер выносится наверх.
  module-scope RegExp не сериализуется в worklet-рантайм
  (объект без методов) — литералы только внутри тел функций.
- **Fabric-спеки**: осталась одна — `NativeWheelPickerSpec`; `codegenConfig` name
  `"RNAppSpec"`, `jsSrcsDir: "src"`. Имя файла фиксировано RN (исключение в
  `eslint.naming.mjs`). Нативная сторона — legacy `RCTViewManager`/`SimpleViewManager`
  через interop-слой New Arch.

## Keyboard compensation (`shared/lib/keyboard/`)

- Один подписчик на экран: `useKeyboardInset`; компенсация скролла списка —
  `useKeyboardScrollCompensation`.
- Один источник сдвига: `contentInset` (shared value) двигает и бар, и зону списка.
- Контейнер списка не транслейтить/сжимать — сдвиг идёт через content inset.
- Freeze держит content inset; thaw — реакцией (`use-freezable-value.ts`).
- Interactive dismiss: `onInteractive` per frame + блокировка скролла при касании
  (`onScrollBeginDrag`/`onScrollEndDrag`).
