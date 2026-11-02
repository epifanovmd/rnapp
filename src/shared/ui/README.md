---
module: shared/ui
summary: UI-кит на React Native + Reanimated — инвентарь компонентов, правила кита и gotcha.
---

# ui

Базовые компоненты без бизнес-смысла. Каждая папка — свой public API `index.ts`;
barrel `shared/ui/index.ts` реэкспортирует все папки (`export *`). Живые примеры —
плейграунд [pages/stack/components](../../pages/stack/components/README.md).

## Инвентарь

| Папка                                                                                                    | Что                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `flex-view/`                                                                                             | FlexView, Row, Col, `useFlexProps` — layout-пропсы поверх style ([README](flex-view/README.md))                                              |
| `text/`                                                                                                  | Text (`textStyle` из `text-styles.ts`, `color` — токен или цвет, `style` последним); компонента заголовка нет                                |
| `icon/`                                                                                                  | Icon на lucide через реестр `icon-registry.ts`: `TIconName`, `ICON_NAMES`; своя SVG — компонент + строка реестра                             |
| `touchable/`                                                                                             | Touchable — нажимаемая основа кита, flex-пропсы                                                                                              |
| `button/`, `icon-button/`, `fab/`                                                                        | Button: `variant` primary/secondary/danger × `appearance` filled/outline/ghost/link (палитра — `useButtonStyles`); IconButton; Fab           |
| `actions/`                                                                                               | NavLink (типизированная ссылка навигации), SwitchTheme                                                                                       |
| `layouts/`                                                                                               | Container (safe area), Content, StatusBar — единственная точка `barStyle`                                                                    |
| `screen/`                                                                                                | ScreenScroll (клавиатура, pull-to-refresh, контекст скролла для reveal), ScreenState, ScreenFallback                                         |
| `scroll-view/`                                                                                           | ScrollView с flex-пропсами                                                                                                                   |
| `keyboard-aware-scroll-view/`                                                                            | KeyboardAwareScrollView — скролл с полями над клавиатурой (`shared/lib/keyboard-aware`)                                                      |
| `keyboard-scroll-view/`                                                                                  | KeyboardScrollView + `useScrollBottomCompensation` — скролл над панелью ввода, перекрытие считает вызывающий                                 |
| `input/`                                                                                                 | Input, TextField (label/accessories/footer, `clearable`, режим поля-триггера `onPress`/`onClear`)                                            |
| `input-bar/`                                                                                             | InputBar, KeyboardInputBar, `useInputBarInset` — панель ввода чата с ответом и голосовой записью (VoiceRecorder)                             |
| `field/`                                                                                                 | Field — label/description/error вокруг контента; горизонтальную раскладку не навязывает                                                      |
| `form/`                                                                                                  | Form, FormField, FormError, FormSubmit, `useZodForm`, `dynamicZodResolver`, `*FormField`-адаптеры, NumberTextField                           |
| `check-box/`, `radio/`, `switch/`, `chip/`                                                               | CheckBox, Radio + RadioGroup, Switch, Chip                                                                                                   |
| `segmented/`                                                                                             | Segmented (Reanimated), SegmentedTabBar — tabBar material-top-tabs на RN Animated                                                            |
| `select/`                                                                                                | Select, GroupedSelect, Autocomplete в шторке + стратегии `use{Static,Async,Controlled,Dependent,Eager,Infinite}Options`                      |
| `date-field/`, `picker/`, `calendar/`                                                                    | DateField (+ `clamp-date`); DatePicker/TimePicker/RangePicker/YearRangePicker на нативном колесе; Calendar, CalendarList                     |
| `bottom-sheet/`                                                                                          | BottomSheet на `@gorhom/bottom-sheet` (compound на слотах), Header/Footer/Backdrop/ScrollContent, `useBottomSheetStack`, `useBottomSheetRef` |
| `modal-sheet/`, `action-sheet/`, `confirm/`                                                              | ModalSheet (API модалки), ActionSheet (пункты данными), `useConfirm` (системный Alert)                                                       |
| `dialog/`                                                                                                | Dialog (Header/Content/Footer), управляемый или через `useDialogRef`; `Dialog.Host`                                                          |
| `context-menu-view/`                                                                                     | ContextMenuView на Reanimated; `ContextMenuView.Host`                                                                                        |
| `navbar/`                                                                                                | Navbar, HiddenBar, ImageBar (compound), NavbarProvider/`useNavbar*`, NavbarInset, NavbarReveal, `useNavbarScrollSync`                        |
| `tab-bar/`                                                                                               | TabBar без знания о навигаторе (адаптер — `widgets/app-shell`), чистая геометрия `tab-bar-geometry.ts`                                       |
| `tabs/`                                                                                                  | Tabs, Tab — горизонтальная лента вкладок                                                                                                     |
| `balanced-row/`                                                                                          | BalancedRow — три зоны, боковые уравнены: центр строго по центру (Navbar, шапки шторок и диалогов)                                           |
| `search/`                                                                                                | SearchBar, NavbarSearchButton/NavbarSearchField, SearchOverlay, SearchShiftView/Spacer, HighlightText                                        |
| `reveal/`                                                                                                | RevealView (`preset`), ScrollRevealAnchor — UI к `shared/lib/scroll-reveal`                                                                  |
| `refresh-indicator/`                                                                                     | RefreshIndicator — визуал pull-to-refresh, кладётся соседом скролла                                                                          |
| `spinner/`, `progress-bar/`, `skeleton/`                                                                 | Spinner (поведение — worklet-стратегия `ISpinnerBehavior`, `progress`); ProgressBar; Skeleton (+ Circle/Text/Group)                          |
| `collapsable/`                                                                                           | Collapsable — высота/opacity на UI-потоке, `collapsedHeight`/`collapsedContent`, `ref.toggle`                                                |
| `carousel/`                                                                                              | Carousel поверх `react-native-reanimated-carousel`, `useCarousel`, слоты Dots/ProgressBars/Counter/Arrows, свой автоплей                     |
| `image/`, `image-viewing/`                                                                               | Image на FastImage (скелетон и фолбэк из коробки); ImageViewing — полноэкранный вьюер с зумом и смахиванием                                  |
| `camera/`, `scan/`                                                                                       | композиционная камера на VisionCamera (CameraProvider, CameraView, контролы); ScanCameraShell, OcrScanCamera, оверлей                        |
| `chart/`                                                                                                 | графики на Skia: Chart, слои, оси, зум/окно (`useChartViewport`), ChartLegend, ChartNavigator, ChartRangePresets                             |
| `avatar/`, `badge/`, `tag/`                                                                              | Avatar (url или инициалы, `online`); Badge — счётчик/точка; Tag — метка статуса                                                              |
| `list-item/`, `disclosure-row/`, `value-row/`, `switch-row/`, `info-row/`, `settings-group/`, `section/` | строки списков и настроек; Section + `Section.Action`                                                                                        |
| `empty-state/`, `notice/`, `stat-card/`, `divider/`                                                      | EmptyState, Notice, StatCard, Divider                                                                                                        |
| `copyable-text/`, `qr-code/`, `ticket/`                                                                  | CopyableText (`useClipboard`), QrCode (`qr-matrix`), Ticket (SVG-маска)                                                                      |
| `tabs-pager/`                                                                                            | пустая папка (только пустой `__tests__/`), в barrel не входит                                                                                |

## Правила кита

- Соседние папки кита — относительными путями (`../flex-view`), не через `@shared/ui`.
- Compound-компоненты — на слотах `shared/lib/slots`
  ([README](../lib/slots/README.md)); образцы — `navbar/`, `bottom-sheet/`.
- Новый компонент — папка с `index.ts` и строка в barrel.
- Примитивы принимают flex-пропсы через `useFlexProps` (см. README `flex-view`).
- Новая иконка — запись в `icon-registry.ts`: `TIconName` и галерея обновятся сами.
- Хосты оверлеев — в `app/App.tsx`: `Dialog.Host`, `ContextMenuView.Host` внутри
  `BottomSheetModalProvider`.
- Шторки уже поднимаются над клавиатурой и держат поля над ней (`BottomSheet.Content`,
  `ModalSheet`); `BottomSheetTextInput` gorhom не использовать.

## Gotcha

- `BottomSheet`: `stackBehavior` — `push` у вложенной (`nested`), иначе `replace`.
  Закрытие у gorhom асинхронное и непрерываемое: `present` листа, который ещё
  закрывается, игнорируется — стек шторок только через `useBottomSheetStack`.
- Закрытие любой шторки убирает клавиатуру; `dismissKeyboardOnOpen` — и при открытии
  (включён в Select/ActionSheet/пикерах).
- `ActionSheet.onSelect` вызывается после закрытия шторки: иначе системный пикер iOS не
  откроется поверх модалки.
- `ModalSheet`: пока `primaryAction.loading`, закрыть нельзя (`canDismissModalSheet`).
- `Select`: сообщение валидации — `errorMessage`, `error` — ошибка загрузки стратегии;
  без `virtual` список виртуализируется сам при > 50 вариантах.
- `QrCode` берёт ядро `qrcode/lib/core/qrcode`: основная точка входа пакета тянет
  node-модули.
- `Image`: проп `fallback` FastImage перекрыт своим (`boolean | ReactNode`).
- `SegmentedTabBar` — RN Animated на нативном драйвере поверх `position` пейджера, не
  Reanimated; цвет нативный драйвер не анимирует — подпись из двух слоёв с перекрёстной
  opacity.
- `HiddenBar` до первого замера высоты лежит в потоке, после — absolute
  (`hiddenBarLayout`), переход в одном кадре с отступом контента.
- Известно, не исправлено: `ImageViewing` вызывает `onIndexChange` внутри updater
  `setState`; `requestAnimationFrame` в `Tabs` без отмены.
