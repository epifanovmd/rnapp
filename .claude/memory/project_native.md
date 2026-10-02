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
  (link:-зависимость в package.json, symlink в node_modules): универсальный on-device OCR и
  детекция объектов для **VisionCamera v5** (`useFrameOutput` + `react-native-vision-camera-worklets`),
  предметной области не знает — модели, классы и правила чтения задаёт JS.
  Спека `src/specs/VisionEngine.nitro.ts` (кодоген: `npx nitrogen@0.36.5`, генерат закоммичен в
  `nitrogen/generated/`; после добавления файлов — `pod install`), принимает `Frame` VisionCamera.
  **API — примитивы над сессией кадра** (конвейер собирает JS): `loadModel(config)` кладёт модель
  в реестр движка по `config.name` и возвращает `DetectorModelInfo` (`loaded`, `labels`,
  `classCount`, `inputWidth/Height`); `openFrame(frame)` → HybridObject `FrameSession`
  (`width/height`, `detect(model, {minScore, iouThreshold?, maxResults?})`,
  `recognize(rois[{rect, padding?}], {mode, minConfidence, maxObservations?, languages?, minRoiSizePx?})`
  → `OcrRoiResult[]` выровнен по индексу запроса, `{read, observations}`; полный кадр —
  rect `{0,0,1,1}`). Сессия освобождается `dispose()` (встроенный метод Nitro, нативно
  переопределён) ДО `frame.dispose()` — иначе держит pixel buffer/битмап. Координаты всегда
  выпрямленные (bufferOrientation/`toUprightRect` убраны). `scan`/`detectObjects`/`analyze`,
  нативный `RegionSelector` удалены — отбор регионов в JS.
  `DetectorModelConfig`: `name`, `labels?`, `resize: letterbox|stretch`, `boxUnits: auto|normalized|pixels`,
  `accelerator: cpu|gpu|nnapi` + `threads` (Android, недоступный делегат → CPU). Дефолты —
  `VISION_ENGINE_DEFAULTS` модуля (resize, boxUnits, accelerator, threads, iouThreshold, minRoiSizePx).
  **Классы — по имени**: имена из метаданных модели (`names`: CoreML — userDefined или
  classLabels NMS-пайплайна; TFLite — `metadata.json` в zip-хвосте файла, смещения архива бывают
  абсолютными и относительными — парсер понимает оба), `labels` конфига их перекрывает.
  Нативный слой зеркален (таблица — README модуля): фасад `HybridVisionEngine` (реестр
  моделей) + `HybridFrameSession` + `{CoreML,Tflite}ModelLoader` + чистые `ModelMetadata`,
  `YoloOutputDecoder` + модель с конфигом (`CoreMLObjectDetector` / `DetectorSlot` поверх
  кэшируемого `TfliteDetector`) + `{VisionTextRecognizer,MlKitTextRecognizer}` + `FrameGeometry`;
  iOS letterbox — `FrameLetterbox` (CoreImage, поля 114, свой буфер, затем `scaleFill`).
  Android: полный кадр (rect `{0,0,1,1}` без padding) читается ML Kit по media image с поворотом,
  прочие области — кропом upright-битмапа сессии; float32 и квантованные uint8/int8 вход/выход,
  вход NHWC/NCHW, выход — любой тензор, двумерный после отбрасывания единичных осей;
  GPU-делегат — зависимость `tensorflow-lite-gpu`.
  **Gotcha кодогена**: `npm run specs` в модуле = `npx nitrogen@0.36.5` + `scripts/strip-struct-equality.cjs`
  (вырезает `operator== = default` из структур с полями `std::vector` — иначе Swift 6.2/Xcode 26
  теряет CxxRandomAccessCollection у вектора во всём модуле: «vector has no member 'map'» в
  генерате; проявилось со вторым HybridObject; margelo/nitro#1186). После — `pod install`.
  Кэши моделей: iOS — по имени (`CoreMLModelLoader`), Android — по имени+вычислителю+потокам;
  реестр — per-instance (NSLock / ConcurrentHashMap), `detect` моделей сериализован.
  JVM-тесты чистых Kotlin-частей: `modules/react-native-vision-engine/android/src/test`,
  запуск `./gradlew :react-native-vision-engine:testDebugUnitTest` из `template/android`
  (junit + org.json testImplementation). Сборка iOS-пода для проверки:
  `xcodebuild -workspace rnapp.xcworkspace -scheme VisionEngine -sdk iphonesimulator build`.
  Gotcha Swift: `Range` в модуле перекрыт типом VisionCamera — писать `Swift.Range`.
  Модели кладутся вручную (`ios/MLModels/*.mlpackage`, `android/.../assets/*.tflite`); без
  модели OCR полнокадровый. Контейнерная модель — 6 классов (`container_code`,
  `container_type`, `container_weight`, `max_gross`, `tare`, `net`), вход 960, выход
  `[1, 10, 18900]` без NMS; CoreML fp16 (координаты в пикселях), TFLite fp32 80 МБ
  (координаты нормализованы). Из метаданных при установке вычищаются `description`/`date`
  (там локальные пути), атрибуция лицензии остаётся.
  JS-архитектура: примитивы кадрового конвейера — `shared/lib/ocr-scan/use-frame-pipeline`
  (`getWorkletEngine`, `shouldEmit`, `publishOverlay`, `useOverlayChannel`, `useStableCallback`,
  `useVisionFrameOutput`). OCR-конвейер кадра — worklet `runOcrPipeline(session, config)`
  (`ocr-worklets.ts`): detect → `selectRegions` (`region-selection.ts`, правила/квоты/отступы,
  `decodeThreshold`) → один `recognize` по кропам → `IOcrScanFrame` {`regions[]`: label,
  classIndex, score, rect, read, observations; `fullFrame[]`; imageWidth/Height}; полный кадр —
  без детектора либо при `fullFrameFallback` и пустых регионах. Конфиг конвейера собирает
  чистый `buildOcrPipelineConfig` (`pipeline-config.ts`; общий лимит регионов по умолчанию —
  сумма квот; детектор входит только после успешного `loadModel`), `resolveModelConfig`,
  `buildRegionTitles`, `findMissingRegions` (dev-warn). Домены получают кадр:
  `extractCandidates(frame)`/`extractAttributes(frame)`; хелперы `frame.ts`: `collectCandidates`
  (извлечение по каждому региону отдельно — текст разных регионов не смешивается; без
  регионов — fullFrame; слияние одинаковых значений, валидные первыми), `regionsOf`,
  `regionObservations`, `frameObservations`, `hasDetectorRegions`. `REGION_DEFAULTS` — пороги
  отбора, `OCR_SCAN_DEFAULTS.maxObservations` — на одну область чтения. `useOcrScanner` отдаёт
  `detectorInfo`; `useObjectScanner` (`model`, `titles` — подписи по имени класса, `classes`;
  отбор — чистый `selectObjects`). Детектор домена — `IOcrScanDetectorConfig`: `model`
  (DetectorModelConfig) + `regions` (`{label, title?, minScore?, maxCount?, padding?}`) + общие
  пороги; камера сужает регионы пропом `regions: string[]`.
  UI-каркас камеры — `shared/ui/scan/ScanCameraShell`, поверх него `OcrScanCamera`
  (`overlayLayers`) и фичевые камеры. Frame-output создаётся на каждый маунт: переиспользование
  между сессиями роняет AVFoundation.
  Домены: `shared/lib/container-ocr` (ISO 6346: контрольная цифра, перебор OCR-подстановок,
  типоразмер, веса), `shared/lib/plate-ocr` (РФ-номера). Контейнерный домен
  (`features/container-scan`) читает регионы `container_code`, `container_type`, `max_gross`,
  `tare`, `net` (табличку `container_weight` целиком — нет); веса: поле из своего региона
  (кг по единице, иначе меньшее правдоподобное число — кг меньше фунтов) приоритетнее разбора
  таблички по подписям и тождеству брутто = тара + нетто; нетто добирается вычитанием после
  слияния. Без детектора `fullFrame` идёт в `sizeType` и `weightPlate`. Кандидаты кода —
  `collectCandidates` по регионам `container_code`. После подтверждения
  кода домен ждёт типоразмер и веса ограниченное число кадров. Автономера — модель
  `plate_detector` одноклассовая, регионы не объявлены (читаются все). Объекты — пример
  `features/object-scan` (`OBJECT_DETECTOR_MODEL`, `OBJECT_CLASS_TITLES` — русские подписи
  по именам классов модели) + `pages/stack/object-scanner`.
  Оверлей — хост + слои: `shared/lib/scan-overlay` — данные (`IScanOverlayBox`
  `{rect, kind: text|candidate|valid|region, label?}`, cover-маппинг, сглаживание);
  `shared/ui/scan/overlay/` — `ScanOverlayHost` (опрос Synchronizable на UI-потоке,
  анти-мигание, маппинг в пиксели один раз, слои получают `IScanOverlayApi` render-prop'ом),
  слои `OverlayFrames`, `OverlayLabels` (подпись региона — `title` из конфига, иначе имя
  класса), `OverlayDim`, хук `useOverlayPath`; `ScanOverlay` — стандартный пресет.
  Системы координат: кадры выпрямляются по ориентации устройства
  (`orientationSource="device"`), превью идёт по ориентации интерфейса; разницу держит
  `usePreviewOrientation`, `publishOverlay` доворачивает боксы — оверлей публикуется в
  координатах превью, доменные rect'ы остаются выпрямленными.
  Экраны с BottomSheet-камерой — `pages/stack/{container,plate,text,object}-scanner`.
  Движки — per-scanner (`createBoxedVisionEngine`, `useScannerInstanceKey` — namespaced
  worklet-кэш и ключи троттлинга). Рантайм-источник дефолтов движка — `VISION_ENGINE_DEFAULTS`
  модуля (нативные фолбэки совпадают). Сканеры отдают `onError` (троттлится) и
  dev-диагностику (`ScanDiagnosticsBadge`, только `__DEV__`).
  Юнит-тесты JS — jest (`npm test`; `react-native-vision-engine` замаплен на
  `jest/stubs/react-native-vision-engine.js` — только `VISION_ENGINE_DEFAULTS`): iso6346,
  candidates, attributes, pipeline-config, region-selection, frame, ocr-pipeline (фейковая
  сессия), select-objects, orientation, cover-маппинг, сглаживание.
  Важно worklet'ам: worklet захватывает в замыкание только функции, объявленные ВЫШЕ по
  модулю — вызов объявленной ниже падает в рантайме камеры как «undefined is not a function»;
  module-scope RegExp не сериализуется в worklet-рантайм — литералы только внутри тел функций.
- **Fabric-спеки**: осталась одна — `NativeWheelPickerSpec`; `codegenConfig` name
  `"RNAppSpec"`, `jsSrcsDir: "src"`. Имя файла фиксировано RN (исключение в
  `eslint.naming.mjs`). Нативная сторона — legacy `RCTViewManager`/`SimpleViewManager`
  через interop-слой New Arch.

## Keyboard compensation

- `shared/lib/keyboard/` знает только клавиатуру: `useKeyboardHeight` — покадровая
  высота на UI-потоке. Перекрытие собирают по месту использования:
  `shared/ui/input-bar` → `useInputBarInset` (safe area + клавиатура + высота панели,
  один подписчик на экран), `shared/ui/keyboard-scroll-view` →
  `useScrollBottomCompensation` (распорка и подъём для нативного ScrollView),
  `widgets/chat` → `useChatListInset` (`insetEnd` для AnchorList).
- Один источник сдвига: `contentInset` (shared value) двигает и бар, и зону списка.
- Контейнер списка не транслейтить/сжимать — сдвиг идёт через content inset.
- Freeze держит content inset; thaw — реакцией (`use-freezable-value.ts`).
- Interactive dismiss: `onInteractive` per frame + блокировка скролла при касании
  (`onScrollBeginDrag`/`onScrollEndDrag`).
- Поля форм над клавиатурой — `shared/lib/keyboard-aware` (`useKeyboardAwareScroll`), см.
  project_components.md «Клавиатура: useKeyboardAwareScroll».

## Выбор фото и файлов (2026-09-26)

- `shared/lib/media-picker` — адаптер над `react-native-image-picker` (галерея через системный пикер, камера) и `@react-native-documents/picker` (файлы): `pickPhotos({limit})`, `takePhoto()`, `pickDocuments({multiple})` → `ILocalFile[]`. Отмена — `[]`, отказ/сбой — `MediaPickerError(code: permission|unavailable|failed)` с русским текстом.
- Документы отправляются локальной копией (`keepLocalCopy` в `cachesDirectory`): у выбранного на Android `content://`, на iOS — защищённый uri.
- Jest: заглушки `jest/stubs/react-native-image-picker.js`, `react-native-documents-picker.js` (по умолчанию — отмена); в тесте — `jest.mock` с фабрикой (spyOn по `import * as` не работает — CJS-копия).
- Источники — конфигурацией в фиче (`features/file-upload/model/file-sources.ts`, `profile-settings/model/avatar-sources.ts`); новый источник — запись.
- `IFileStore.uploadMany` — очередь по одному, `uploadQueue {index,count}` + `uploadProgress` 0..1; ошибка файла не останавливает остальные.
