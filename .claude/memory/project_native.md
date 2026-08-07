---
name: Native Modules (iOS & Android)
description: Нативные модули и JS-порты чата; keyboard compensation
type: project
---

## Нативные модули

- **ChatView / InputBar / ContextMenu** — iOS-бриджи (`ios/{ChatView,InputBar,ContextMenu}/Bridge/`,
  3 файла каждый). UI — во внешнем поде **`IOSChatView`**
  (`ios/Podfile`: `pod 'IOSChatView', :path => '../../../rn-chat-view'` — sibling repo).
  Android-native нет — на Android/non-iOS работают JS-порты
  `JsChatView`/`JsInputBar`/`JsContextMenuView`.
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
- **OcrEngine** (`template/modules/react-native-ocr-engine`) — локальный Nitro-модуль
  (link:-зависимость в package.json, symlink в node_modules): универсальный on-device OCR для
  **VisionCamera v5** (Nitro-архитектура, `useFrameOutput` + `react-native-vision-camera-worklets`),
  предметной области не знает — домены в JS.
  Спека `src/specs/OcrEngine.nitro.ts` (кодоген: `npx nitrogen@0.36.5`, генерат закоммичен в
  `nitrogen/generated/`), принимает `Frame` VisionCamera как внешний nitro-тип.
  iOS: `ios/HybridOcrEngine.swift` — `VNRecognizeTextRequest` + опц. CoreML-детектор регионов
  (`ios/MLModels/container_code_detector.mlpackage`, synchronized group в pbxproj).
  Android: Kotlin — ML Kit text-recognition + опц. TFLite YOLO-детектор
  (`android/app/src/main/assets/container_code_detector.tflite`), `YoloRegionDetector` — декодер+NMS;
  cast `frame as NativeFrame` → `ImageProxy`. `scan` синхронный, вызывается из frame-worklet'а
  через `NitroModules.box`/`unbox`. Модели детекторов (YOLO → CoreML c NMS /
  TFLite) кладутся в приложение вручную (`ios/MLModels/`, `android/.../assets/`);
  без модели OCR работает полнокадрово.
  JS-архитектура мультидоменная: универсальный пайплайн — `shared/lib/ocr-scan`
  (`useOcrScanner` параметризуется `IOcrScanDomain`: worklet `extractCandidates`,
  `confirmStreak`, имя модели детектора, опц. атрибуты; выпрямление координат,
  сглаживание оверлея) + `shared/ui/ocr-scan` (`OcrScanCamera`/`OcrScanOverlay` —
  камера создаёт frame-output на каждый маунт: переиспользование между сессиями
  роняет AVFoundation). Домены: `shared/lib/container-ocr` (ISO 6346: контрольная
  цифра, перебор OCR-подстановок, веса/типоразмер), `shared/lib/plate-ocr`
  (РФ-номера: формат ГОСТ, латинско-кириллические подстановки). Фичи-обвязки:
  `features/container-scan`, `features/plate-scan`, `features/text-scan`
  (произвольный текст через `onObservations`). Экраны с BottomSheet-камерой —
  `pages/stack/{container,plate,text}-scanner`.
  Важно worklet'ам: module-scope RegExp не сериализуется в worklet-рантайм
  (объект без методов) — литералы только внутри тел функций.
- **Fabric-спеки**: `NativeChatViewSpec`/`NativeInputBarSpec`/`NativeContextMenuViewSpec`/
  `NativeWheelPickerSpec`; `codegenConfig` name `"RNChatViewSpec"`, `jsSrcsDir: "src"` —
  одна библиотека на все спеки. Имена файлов фиксированы RN (исключение в `eslint.naming.mjs`).
  Нативная сторона — legacy `RCTViewManager`/`SimpleViewManager` через interop-слой New Arch.
- **InputBar**: высота приходит через `onHeightChange`, хост применяет к style.

## JS-архитектура чата (`shared/ui/chat-view/`)

Слои: `types → utils → config → data → services → model → hooks → components`.

- `model/` — контекст чата и стор подсветки.
- `config/chat-styles.ts` — `createChatStyles(theme, layout)`, прекомпиляция стилей ячейки.
- `config/` — `IChatLayout` (метрики чата). Метрики панели ввода — `IInputBarLayout` в `input-bar`.
- `data/` — разбор + кеш идентичности (`message-parser.ts`, `chat-rows.ts`).
- `hooks/` — по хуку на ответственность.
- `services/` — `voice-player.ts`.

### Что делегировано LegendList

| Задача | Механизм |
|---|---|
| Позиция скролла, FAB | `sharedValues={{ scrollOffset, isNearEnd, activeStickyIndex }}` |
| Плавающая дата | `stickyHeaderIndices` + `stickyHeaderConfig.offset` |
| Видимость / прочитано | `viewabilityConfigCallbackPairs` |
| Пагинация | `onStartReached`/`onEndReached` |
| Позиция при вставках | `maintainVisibleContentPosition={{ data, size }}` |
| Автоскролл к новым | `maintainScrollAtEnd` |

Ручные JS-аналоги не допускаются.

- **Аватары**: статические в ячейке; `avatarColumn` — спейсер, `ChatAvatar` — absolute.
  Отступ аватар→пузырь = cellHMargin + avatarBubbleSpacing.
- **Пузырь**: `minHeight: cellMinHeight - cellVSpacing`, pinned top+bottom ячейки.
- **`features.disintegrationEnabled`** — только iOS. `JsChatView` игнорирует.

## Keyboard compensation (`shared/lib/keyboard/`)

- Один подписчик на экран: `useKeyboardInset` + `useKeyboardScrollCompensation`.
- Один источник сдвига: `bottomInset` (shared value) двигает и бар, и зону списка.
- Зона — спейсер в конце контента, не `contentInset`.
- `ChatList`: `maintainScrollAtEnd.on` — только `dataChange`. `footerLayout`/`itemLayout` не включать.
- Контейнер списка не транслейтить/сжимать.
- Freeze держит content inset; thaw — реакцией (`use-freezable-value.ts`).
- Interactive dismiss: `onInteractive` per frame + блокировка скролла при касании
  (`onScrollBeginDrag`/`onScrollEndDrag`).
- `scrollToMessage`: `viewOffset = -viewPosition * getBottomInset()`.
