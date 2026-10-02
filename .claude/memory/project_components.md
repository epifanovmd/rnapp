---
name: Components Library
description: UI-кит shared/ui, compound components через slots
type: project
---

Весь UI — в `src/shared/ui/` (кроме `TabBar` в `widgets/app-shell/`):
layout, navbar (compound: BackButton/Title/Subtitle/Right...),
carousel (обёртка над react-native-reanimated-carousel: без настроек — loop-карусель на всю
ширину контейнера; контекст `useCarousel` (progress/count/loop/autoPlayActive (shared,
синхронно к остановке)/scrollTo/next/prev/touching) + слот-компоненты
`Carousel.Dots`/`Carousel.StoryBars` (полоски как в stories, mode scroll|timer; без
активного автоплея — пагинация, idleVariant fill|move; в timer активная = таймер
(duration=interval) + дробь прогресса — свайп сам доводит заполнение)/
`Carousel.Counter`/`Carousel.Arrows`; автоплей — СВОЙ движок `hooks/useCarouselAutoPlay`
(библиотечный отключён): пауза с ОСТАТКОМ интервала при касании/жесте, resume без смены
слайда продолжает отсчёт, свайп на другой слайд — остановка насовсем
(stopAutoPlayOnInteraction, default false) или полный интервал, интервал default 2000,
переход через next({onFinished}); ВАЖНО: либа шлёт onScrollStart/onScrollEnd и для
программных переходов — движок помечает их флагом programmaticNext (markProgrammatic для
scrollTo/next/prev контекста), без loop автоплей останавливается на последнем слайде
насовсем (resumeAutoPlayAfterEnd, default false — возобновлять после отмотки назад);
все пропы либы прокидываются, внешние onProgressChange (функция/shared)/onScrollStart/
onScrollEnd/carouselRef работают, onReachEnd — приезд на последний слайд без дублей),
button (`variant` primary/secondary/danger × `appearance` filled/outline/ghost — ортогональны,
палитра — один record в `hooks/useButtonStyles.ts`, новый вариант = одна строка; цвета
контента резолвятся в реальные для Icon/ActivityIndicator),
input (+TextField: состояние в `hooks/useTextFieldState.ts`, визуальные части в
`components/` — TextFieldLabel/TextFieldAccessories/TextFieldFooter; `left`/`right`
ReactNode-слоты, токены text-styles, визуальный disabled),
bottom-sheet (@gorhom), balanced-row (три зоны, боковые уравнены по ширине — центр строго по
центру; используют Navbar, BottomSheetHeader и DialogHeader), dialog (compound
Dialog.Header/Content/Footer; управляемый `isVisible`/`onClose` или императивный через
`useDialogRef` → present/dismiss; логика в `dialog/hooks/` — visibility, animation,
animated-styles, gestures, back-button, styles; заменяемый `backdropComponent`; Portal +
Dialog.Host в App.tsx; свайп/бэкдроп/hardware-back, slide|fade|scale-анимации), text, icon (lucide-react-native через реестр `icon-registry.ts`: имя → компонент, `TIconName`
и `ICON_NAMES` выводятся; кастомная SVG — компонент по контракту `IIconGlyphProps`
(size/color, пример `icons/CheckBold.tsx`) + строка в реестре; пропы size/color/strokeWidth),
picker (нативный
WheelPicker), chart (Skia), flex-view, context-menu-view (Reanimated,
синглтон Host в App.tsx), image-viewing (свой fullscreen-вьюер: Reanimated + **hook-API RNGH v3**
(`usePinchGesture`/`usePanGesture`/... — builder `Gesture.*` в v3 деприкейтнут) — pinch с
фокальной привязкой/rubber за maxScale/ре-анкеровкой при смене пальцев, pan c инерцией,
double-tap в точку, swipe-to-dismiss; SRP-разделение: `use-zoom-gesture` (только зум),
`use-dismiss-gesture` (только смахивание, собственный translateY), `use-viewer-gestures`
(композиция + animatedStyle + reset); кастомизация render-пропсами
renderHeader/renderFooter/renderImage; FastImage + previewUri + префетч соседних),
keyboard-scroll-view (проп `insetEnd`, компенсация внутри),
screen/ScreenScroll (`useKeyboardAwareScroll` + `usePullToRefreshScroll` + RefreshIndicator, без
системного RefreshControl; `ScreenScrollView` — Animated.ScrollView, GestureDetector протяжки вплотную
к нему (проп `gesture`); `onRefresh` → Promise держит
индикатор, void — завершение по refreshing true→false; `telemetry` экрана чейнится в свою), fab (круглая кнопка
действия), actions,
spinner (единый индикатор кита, бывший animated-refreshing; SRP-разделение: Spinner —
разметка, `hooks/useSpinnerAnimation` — движок (фаза+вращение), поведение — worklet-стратегия
`ISpinnerBehavior` (`spinner-behaviors.ts`: WORM_SPINNER_BEHAVIOR — дефолт-«червяк»,
CLASSIC_SPINNER_BEHAVIOR — фикс-дуга; своё поведение = новый объект, компонент не меняется);
`progress` 0..1 (число или shared value) — круговой прогресс; ActivityIndicator в ките не
используется),
check-box, chip, collapsable (Reanimated: высота/opacity на UI-потоке, обрезанное превью
`collapsedHeight` или кросс-фейд `collapsedContent`, semi-controlled `collapsed` +
императивный `ref.toggle`, авто-измерение динамического контента), field, image, scroll-view,
switch, tabs, ticket, touchable, field (label/description/error-слоты вокруг контента;
горизонтальную раскладку контента НЕ навязывает — Row собирает вызывающий),
avatar (url/инициалы + детерминированный цвет, online-статус), badge (счётчик/max/dot,
standalone или поверх children), divider (горизонтальный/вертикальный/с label),
progress-bar (determinate/indeterminate, Reanimated), radio (Radio + generic RadioGroup),
skeleton (компаунд: `Skeleton` — блок любой формы (width/height/borderRadius/flex + style),
`Skeleton.Circle`, `Skeleton.Text` (lines/lastLineWidth), `Skeleton.Group` — один общий пульс
на группу, вложенные блоки мигают синхронно; children рендерятся поверх блока — статичная
подложка с пульсирующими вложениями). `icon` экспортирует `ICON_NAMES` для галерей.

**Плейграунд** (`pages/stack/components/`, top-tabs): Buttons, Typography (все textStyle +
цвета + Title), Icons (галерея ICON_NAMES), Inputs (TextField/Field-слоты),
Controls (Switch/Checkbox/RadioGroup/Chip/NavLink/SwitchTheme), Layout (Row/Col/BalancedRow/
Divider/Collapsable), Feedback (ProgressBar/Skeleton/Badge/Avatar/Spinner),
Media (Image/ImageViewing), Carousel (обёртка без настроек/stories/parallax/тикер/useCarousel),
Notifications, Modals, Dialogs, Pickers, Ticket, Forms (`tabs/forms/`: Select-варианты, форма
useZodForm+Form со всеми *FormField, ModalSheet-форма с nested Select/ActionSheet), Data
(`tabs/data/`: Tag/ListItem/InfoRow/CopyableText/StatCard/Notice/EmptyState/ScreenState/QrCode/
IconButton/useConfirm), Screen (`tabs/ScreenTab.tsx`: ScreenScroll с PTR в Promise-режиме + поля ввода внизу —
отдельная вкладка, т.к. DemoScreen сам скролл).
Заголовков-компонента (title) в ките нет — обычный `Text` с textStyle.
Обёртка демо-таба — `tabs/DemoScreen.tsx` (`DemoScreen` — скролл с телеметрией HiddenBar,
`DemoSection` — секция с заголовком/описанием).

**camera** (`shared/ui/camera/`) — композиционная камерная система поверх VisionCamera 5.
`core/`: узкие интерфейсы API (`ICameraApi` = status/device/zoom/focus/torch/exposure, `types.ts`),
`CameraProvider` (композиционный корень: девайс, разрешение — внешний адаптер или встроенное,
движки `use-camera-{zoom,focus,torch,exposure}.ts`; torch — controlled/uncontrolled),
`camera-context.ts` (`useCameraApi` + внутренний контекст для адаптера). `CameraView` —
единственное место рендера нативной `Camera` (зум/экспозиция — SharedValue на UI-потоке).
`gestures/CameraGestureLayer` — pinch-zoom / tap-to-focus / double-tap-reset; контролы зависят
только от `useCameraApi`: `CameraFocusRing`, `CameraZoomBadge` (нативный `text`-проп TextInput),
`CameraZoomPresets` (чипы кратностей под девайс), `CameraTorchToggle`, `CameraFlipToggle`,
`CameraExposureSlider` (вертикальный EV), `CameraGrid`, `CameraControlButton`,
`CameraPermissionGate` (заглушки/renderFallback). `ScanCameraShell` (`shared/ui/scan`) собран из
этой системы: зум и тап-фокус включены по умолчанию, опционально пресеты/сетка.

**flex-view** — layout-пропсы поверх style (`<Row pa={16} bg="surface">`); устройство,
применение и инструкция добавления новых пропсов — `src/shared/ui/flex-view/README.md`.

**Compound-компоненты — через slots**: схема `slot.of(Component)` / `slot<Props>()` +
`createCompound<P, Ref>()({ name, render, slots })`. Модули `shared/lib/slots/`: `slot.ts`
(декларация), `slot-entries.ts`, `slot-markers.ts`, `slot-handle.ts`, `slot-merge.ts`,
`slot-meta.ts`, `slot-validate.ts` (проверки только под `__DEV__`),
`resolve-children.ts`/`resolve-object.ts` (стратегии), `create-compound.ts`, `slot.types.ts`.
Слоты распознаются по метаданным владельца, не по имени; корень получает
`props/slots/content/hasContent/forwardedRef` и вызывается функцией — лишнего фибера нет.
Слот рендерится через `render({ defaults, inject, fallback })`: инъекция props владельца
идёт поверх props потребителя по политике `mergeSlotProps` (`style` склеивается, `on*`
вызываются оба). `children` слота может быть render-функцией — свой рендер получает те же
слитые props. Слот, чей компонент сам compound, наследует его статики
(`BottomSheet.Footer.PrimaryButton`) и настраивается вложенным объектом
`slots={{ footer: { slots: { primaryButton: {...} } } }}`. Режимы совмещаются: `slots` — база,
JSX-маркеры перекрывают. Примеры — `shared/ui/navbar/Navbar.tsx`,
`shared/ui/bottom-sheet/`. Детали — `shared/lib/slots/README.md`.

## Image (`shared/ui/image`, 2026-09-26)

`Image` = контейнер `View` (overflow hidden, FlexProps-размеры/радиус на нём) +
`FastImage` absoluteFill. Скелетон на загрузке и фолбэк при ошибке/пустом url
из коробки: пропы `skeleton`/`fallback` — `true` (дефолт) | `false` | свой
ReactNode; `fallbackIcon`; `source` (полный FastImage-source, главнее `url`;
`url` теперь опционален); `children` — слой поверх (бейджи, градиенты).
Состояние — чистый `image-load-state.ts` (loading|loaded|error, тесты) + хук
`useImageLoadState` (сброс по смене источника); экспортируются `ImageSkeleton`,
`ImageFallback`, хук — для своих композиций (пример — GalleryTile).
Проп `fallback` FastImage перекрыт нашим (Omit в типе). `ImageBar`
(`shared/ui/navbar`) использует его в слоте `image`: анимация
высоты/прозрачности — на Animated.View-обёртке, не на самом Image.

## Стек шторок (`shared/ui/bottom-sheet/hooks/useBottomSheetStack.ts`, 2026-09-29)

Стек поверх `stackBehavior: "replace"` (он зашит в `BottomSheet`, наружу не
пробрасывается): на экране всегда один лист, история — в хуке. API:
`sheets[key]` (`ref` + `onDismiss`) в лист, `present/back/dismiss/isOpen/activeSheet`.

Gotcha gorhom 5.2.x, из-за которой стек ломался при быстром переключении:
закрытие асинхронное и **непрерываемое** — `handleSnapToIndex` выходит по
`isForcedClosing`, поэтому `present()` по листу, который ещё доигрывает закрытие,
не открывает его, но `mountSheet` при этом всё равно закрывает текущий верхний
лист (схлопывается весь стек). Плюс запоздавший `onDismiss` заменённого листа
нельзя отличать от настоящего по вершине истории — при `back()` вершина уже
равна этому же ключу.

Решение в хуке: `visibleRef` (что реально на экране), `closingRef` (закрытия, чей
`onDismiss` ещё не пришёл), `pendingPresentRef` (показ, отложенный до `onDismiss`
того же листа). Закрытием стека считается только `onDismiss` листа, который на
этот момент был видимым; история чистится там же, а не в `back/dismiss`.
Тесты — `hooks/__tests__/use-bottom-sheet-stack.test.ts` (фейковый хост
моделирует replace + отложенный `onDismiss`).

## ActionSheet (`shared/ui/action-sheet`, 2026-09-26)

Шторка выбора действия поверх `BottomSheet`: пункты данными (`IActionSheetItem<TKey>`: key, title, description, icon, destructive, disabled), карточка `surface` со строками (иконка в круге `primary`/`danger`, заголовок, подпись, chevron), кнопка «Отмена». `onSelect(key)` вызывается ПОСЛЕ закрытия (`onDismiss`) — иначе системный пикер iOS не откроется поверх модалки. Открытие — `ref.current?.present()` (`useBottomSheetRef`).

## Дополнения кита (2026-10-01)

- `ModalSheet` — управляемая шторка с API модалки (`open`/`onOpenChange`, `title`,
  `description`, `primaryAction`, `cancelLabel`): формы фич открываются в ней.
- `TextField` внутри любой gorhom-шторки — цель клавиатуры (`useSheetKeyboardTarget`,
  повторяет логику `BottomSheetTextInput`), отдельный `BottomSheetTextInput` не нужен.
- `Select`/`SelectFormField` (шторка со списком и поиском), `Segmented`/
  `SegmentedFormField`, — общая дорожка `SegmentedTrack` (сегменты, замеры onLayout,
  `scrollable` с автоцентрированием); `Segmented` — подложка и цвет подписи на Reanimated
  (`SegmentedIndicator`/`SegmentedLabel`, анимация к индексу `value`);
  `SegmentedTabBar` — tabBar для material-top-tabs на RN Animated поверх `position`
  пейджера (нативный драйвер, синхронно со свайпом и нажатием): подложка из трёх слоёв
  (скруглённые шапки + тело 1px со `scaleX`, как TabBarIndicator в tab-view —
  `SegmentedTabIndicator`), подписи — два слоя с перекрёстной opacity (`SegmentedTabLabel`);
  геометрия — чистый `segment-indicator.ts` с тестами. Gotcha: JS-слушатели `position`
  при нативном драйвере не вызываются — зеркалить в Reanimated нельзя. value сегмента =
  `route.key`, `NumberFieldFormField` (число или `null`).
- `Tag` (метка статуса; `Badge` — счётчик), `ListItem`, `EmptyState`, `ScreenState`,
  `ScreenScroll`, `InfoRow`, `CopyableText`, `StatCard`, `Notice`, `QrCode`
  (ядро `qrcode/lib/core/qrcode` — основная точка входа пакета тянет `fs`),
  `useConfirm` (системный Alert), `CHART_COLORS`.
- `Text`: `color` — токен или любой цвет; `style` применяется последним (раньше
  конвертер flex-пропсов его отбрасывал).
- `useClipboard` (`@shared/lib/hooks`) грузит `@react-native-clipboard/clipboard` лениво:
  без `pod install` приложение не падает, `copy` вернёт `false`.

## Select / GroupedSelect / Autocomplete (`shared/ui/select`, 2026-10-02)

Порт веб-Select под мобильный UX: поле-триггер в стиле TextField +
`nested` BottomSheet со списком. API как в вебе: дискриминированные режимы
(single / clearable / labelInValue / multi / multi labelInValue / `multi: boolean`),
`SelectDataProps` от стратегий (`useStatic/Async/Eager/Infinite/Dependent/ControlledOptions`,
ядро `useOptionsRequest` с AbortController — как в вебе, без холдеров),
`groups`, `creatable`+`onCreate`, `optionRender/renderValue/tagRender`, `hideEmpty`,
`closeOnClear`, `virtual`, ref `{ open, scrollTo }`.
Отличия от веба: сообщение валидации — `errorMessage` (`error` = ошибка загрузки
стратегии); `filterOption` у Select (клиентский фильтр, пока нет `onSearch`);
multi — выбор мгновенный, «Готово»/«Очистить» в футере; single clearable —
крестик в поле + строка «Не выбрано»; поиск/ввод — над списком в шторке;
Autocomplete — поле открывает шторку с инпутом (фокус по `onChange` шторки).
Карта: `hooks/` (useSelectEngine, useLabelCache, useCreatableOption, useSelectSheet —
present/dismiss по флагу как ModalSheet, useLoadMore — латч догрузки), `utils/`
(option-rows: clear/create/group/option строки, value-mode, scroll-edge, select-defaults),
`components/` (SelectTrigger(+Value/Tags/Tag), SelectSheet → SelectSheetBody →
SelectOptionsList (BottomSheetScrollView) | SelectVirtualList (AnchorList)).
Высота шторки: тело сообщает в слот контента естественную высоту (шапка + контент
списка), у AnchorList высота задаётся явно (min(контент/оценка, maxHeight)).
AnchorList в gorhom-шторке — `bottom-sheet/hooks/useBottomSheetScrollableBridge`
на публичном API gorhom: `useScrollableSetter` + `useScrollEventsHandlersDefault`
(через `refScrollView`/`scrollHandlers` AnchorList), нативный жест скролла
(`useBottomSheetScrollGesture`) — в `GestureDetector` через `renderScrollView` и в
`simultaneousHandlers` шторки. На устройстве не проверено.
Типы reanimated у link-пакета anchor-list — своя копия: `refScrollView` кастуется.
Form: `SelectFormField<TForm>` (clearable по умолчанию true), `MultiSelectFormField`,
`AutocompleteFormField`; закрытие шторки = `field.onBlur`.

## Дополнения кита (master, 2026-10-02): поля даты, строки настроек, легенда

- `TextField` — режим поля-триггера: проп `onPress` (нажатие по плашке вместо фокуса,
  ввод выключен, TextInput `pointerEvents="none"`, вид НЕ disabled) + `onClear` (крестик
  `clearable` работает и в триггере, сброс не открывает пикер). disabled = только
  `editable={false}`. Логика режима — чистый `input/text-field-mode.ts` (тесты).
- `DatePicker` — `ref` (React 19 ref-as-prop) `{ open, close }`; без `children` рендерит
  только шторку. Границ min/max у него нет.
- `DateField` (`shared/ui/date-field`) — TextField-триггер + DatePicker с «Готово»,
  clamp по `minDate/maxDate` (`clamp-date.ts`), `format` (date-fns, def `d MMMM yyyy`),
  сброс → `null`. `DateFormField` (form/fields) пишет `Date | null` (схема `.nullable()`).
- `ValueRow` (на DisclosureRow), `SwitchRow` (нажатие по строке переключает), `SettingsGroup`
  (surface/radius 16/ph 16, Divider между детьми, фрагменты раскрываются `flatten-children`).
  `SwitchFormField` = SwitchRow с плашкой onSurface.
- `Section` — compound: слот `Section.Action` (`SectionAction` title/onPress) справа от заголовка.
- `ChartLegend` (`chart/legend`): `series` | `items {key,label,color}`, контролируемо
  `hiddenKeys`/`onToggle`; `useChartSeriesToggle(series)` → `visibleSeries` (отдавать в
  `<Chart series>` — скрытая серия уходит из тултипа и домена) + `legendProps`; правила —
  `series-visibility.ts` (последнюю видимую не выключить, тесты). Gotcha:
  `CurrentValueLineLayer seriesId=…` при отсутствии серии падает на `series[0]`.
- `ScreenFallback` (screen/) — Navbar с «назад» (`onBack`) + ScreenState
  (loading / error+retry / notFound).
- Плейграунд: вкладка Settings (группы строк, Section.Action, ScreenFallback), Forms —
  DateField-демо и DateFormField/SwitchFormField в демо-форме; Charts — LegendDemo.

## Готовность экрана (screen-ready)
- `shared/lib/navigation/screen-ready`, три уровня:
  - `route-path.ts` — чистые функции над деревом состояния: `findRoutePath`, `resolveStackRouteKey` (ближайший экран стека), `isPathFocused`, `findRouteKeyByName` (верхний из одноимённых) (тесты).
  - `screen-readiness.ts` — сервис вне React: `createScreenReadiness({ getRootState, subscribeState, tracker })` → `isReady`, `subscribe`, `onReady(routeKey, cb, { waitForFocus, waitForTransition, delay, timeout=1000 })` → отмена, `whenReady` (промис); по имени маршрута — `isRouteReady(name)` (нет в дереве — не готов), `onRouteReady(name, cb(key))` / `whenRouteReady(name)` → ключ: ждёт появления экрана в дереве (тесты на фейковых таймерах).
  - `app-screen-readiness.ts` — экземпляр приложения `screenReadiness` (navigationRef + `screenTransitions`).
  - `use-screen-ready.ts` — тонкий хук (`once`), ключ экрана из `NavigationRouteContext`.
- Память анимаций — `screenTransitions`, питается `screenTransitionListeners` в `RootStack.screenListeners`; карточка стека шлёт `transitionEnd` и стартовому экрану. Без подключения — отпускает по `timeout`.
- Демо: `ComponentsScreenReady` (ссылки на тяжёлый экран, delay, `whenRouteReady` вне React с тостом времени) и `ComponentsScreenReadyTarget` (скелетоны → 4 Skia-графика, параметр `delay`); файлы `demos/screen-ready/`. Charts и Carousel монтируются сразу, без хука.

## Плейграунд компонентов
- `pages/stack/components`: экран `Components` — ссылки `NavLink` на демо-экраны; список — `component-demos.ts`.
- Каждое демо — отдельный экран корневого стека `Components<Name>` (`App.screens.ts`, linking `components/<name>`), файлы `demos/*Demo.tsx`, обёртка `DemoScreen` (без общей шапки/телеметрии).
- `ComponentsTabs` (`demos/tabs`) — демо HiddenBar + закреплённые Tabs над top-tabs: общая телеметрия (`useScrollTelemetry` + `useNavbarScrollSync`), во вкладках `useFocusedScroll` и `NavbarInset`, `lazy`, на смене вкладки `navbar.show()`.
- `Button` appearance: filled | outline | ghost | link (link — только текст, без отступов).

## Клавиатура: useKeyboardAwareScroll (`shared/lib/keyboard-aware`, 2026-10-02)

Замена `KeyboardAwareScrollView` keyboard-controller'а на своих примитивах
(`useKeyboardHandler`, `useReanimatedFocusedInput`, `useWindowDimensions`).
- `keyboard-aware-offset.ts` — чистая геометрия (тесты `__tests__/keyboard-aware-offset.test.ts`):
  `computeKeyboardAwareOffset` (поле целиком над `min(низ скролла, верх клавиатуры) - bottomOffset`;
  ушло выше `visibleTop` — вниз; высокое поле прижимается началом к верху; clamp `[0, maxOffset]`),
  `keyboardProgress`, `interpolateScrollOffset`, `keyboardOverlap` (высота распорки),
  `computeMaxScrollOffset` (конец контента = верх распорки + высота), `clampScrollOffset`,
  `predictAnchoredViewport` (целевая видимая область шторки: верх = верх в покое − min(клавиатура,
  запас подъёма), низ = верх клавиатуры − bottomInset). `field-layout.ts` — `isFieldHeightChange`.
- `useKeyboardAwareScroll(scrollRef: AnimatedRef<Animated.ScrollView>, { bottomOffset=16, enabled,
  topInset (TAnimatedNumber, навбар), spacer=true, keyboardAnchor: { bottomInset, liftRoom } })` →
  `{ registry, spacerRef, spacerStyle, spacerHeight }`. Смещение и drag/momentum слушает сам
  (`useEvent` + `scrollRef.observe` → registerForEvents), onScroll подключать не нужно.
  onStart: замер поля и распорки в координатах КОНТЕНТА (offset из событий), резерв распорки;
  onMove: цель пересчитывается каждый кадр по `measure(scrollRef)` (у шторки — по прогнозу),
  смещение = lerp(start, goal, прогресс); onEnd — доводка (animated, если > 2px); скрытие —
  распорка ужимается покадрово с зажимом смещения. Смена поля без смены высоты — onStart →
  сразу animated scrollTo. Пересчёт: `registry.notifyLayout` (onLayout контейнера и
  onContentSizeChange TextInput — рост multiline), рост `input.value.layout.height`. Рост во время
  анимации клавиатуры не теряется: флаг `pendingRecapture` → перезамер и доводка в onEnd.
- Без лишних scrollTo: поле целиком в (прогнозной) видимой области → `computeKeyboardAwareOffset`
  возвращает текущее смещение без clamp; `shouldScrollTo` (≥0.5px) — в onMove не зовём scrollTo,
  если цель = старт. Причина: каждый scrollTo шлёт onScroll (RN force-dispatch), а gorhom в
  LOCKED-состоянии (шторка в переходе, его keyboard status ещё не SHOWN) сбрасывает offset в своём
  onScroll → дёрганье верхних полей. (Гипотеза по коду, на устройстве не подтверждено.)
- onEnd перезамеряет поле по `event.target` (`focus-capture.ts` `shouldCaptureOnEnd`, тесты): тег
  в onStart мог быть -1/прежним. Реакция на `input.value` — только рост того же target.
- Возврат при закрытии (`restoreOnHide`, def true; проп кита `restoreScrollOnKeyboardHide` у
  ScreenScroll/DemoScreen (def true), BottomSheet.Content/ModalSheet (def false)): offset
  запоминается в onStart при from=0; смена поля не перезаписывает. При скрытии, если не было drag
  (BeginDrag/MomentumBegin при открытой клавиатуре) и onInteractive, — покадровый lerp к цели,
  зажатый по контенту с уменьшающейся распоркой; доводка в onEnd. Чистое — `restore-on-hide.ts`
  (тесты). В шторке выключен: на опускании gorhom её скролл LOCKED, его onScroll сбрасывает
  любой scrollTo в lockPosition (0) — возврат дёргал бы контент. Демо — SwitchRow в Keyboard · Scroll.
- Gotcha шторки: gorhom поднимает шторку по JS `Keyboard` событиям (keyboardWillShow → runOnUI,
  ждёт target из onFocus) своей анимацией — позже кадров keyboard-controller; высокая шторка
  (позиция 0) не едет, а ужимает маску снизу (contentMax = container − kb − handle, paddingBottom =
  kb). Поэтому замер вьюпорта в кадре давал низ «над клавиатурой под футером» и доводку только
  после анимации. Решение — `keyboardAnchor`: геометрия в покое на onStart (from 0) + прогноз.
- Реестр: `KeyboardAwareContext` (тег TextInput → animated ref контейнера). `useKeyboardAwareField(inputRef)`
  в `TextField` — регистрация на mount (`findNodeHandle`, как useSheetKeyboardTarget; на focus — гонка
  с onStart), корень TextField стал `Animated.View collapsable={false}` с `onLayout`. Поле не из
  реестра — fallback на `useReanimatedFocusedInput`, только если `parentScrollViewTarget` = тег скролла.
  NumberTextField/DateField/Select/Autocomplete — через TextField; InputBar не трогали.
- `KeyboardAwareContent controller` — Provider + дети + `KeyboardAwareSpacer` последним. После
  распорки отступов быть не должно (paddingBottom — внутри детей), иначе maxOffset занижен.
- Подключение: ScrollView — `ref={scrollRef}` + `<KeyboardAwareContent>`; шторка —
  `BottomSheet.Content` = `bottom-sheet/BottomSheetScrollContent` (BottomSheetScrollView +
  хук с `spacer: false` + `keyboardAnchor` { bottomInset из BottomSheetLayout (`keyboardBottomInset`
  инжектится в слот контента: футер + gap 16 + 12), liftRoom: gorhom `animatedPosition` };
  `BottomSheetLayout` — paddingBottom по прогрессу клавиатуры: safe area → `SHEET_KEYBOARD_GAP` 12
  (`sheet-keyboard-layout.ts`, тесты), в dynamic sizing идёт отступ закрытого состояния);
  AnchorList — `refScrollView={scrollRef as unknown as IAnchorListProps<unknown>["refScrollView"]}`,
  `ListFooterComponent={<KeyboardAwareSpacer/>}` (последним), Provider снаружи; `insetEnd` не
  передавать (сам двигает смещение), `scrollHandlers` не нужны. Типы проверены, демо нет.
- Применено: `ScreenScroll`, `BottomSheet.Content` (→ ModalSheet), `DemoScreen` плейграунда.
  `pages/stack/{profile,security}` ещё на KeyboardAwareScrollView.
- Демо: `ComponentsKeyboardScroll` (ScreenScroll, 12 полей, onBlur-валидация, multiline внизу) и
  `ComponentsKeyboardSheet` (ModalSheet с той же формой), `demos/keyboard/`.
- Не покрыто тестами (RN/Reanimated рантайм): сам хук, реестр, замеры `measure`, события клавиатуры.
  На устройстве не проверено. Риски: согласованность `measure` (shadow-tree offset) с offset из
  событий в момент захвата; Android < 11 без onMove — только доводка в onEnd (animated scrollTo);
  layout, изменившийся во время анимации клавиатуры, учитывается только следующим notifyLayout.
