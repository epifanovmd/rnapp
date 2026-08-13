---
name: Components Library
description: UI-кит shared/ui, widgets/chat-room, compound components через slots
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
WheelPicker), chart (Skia), flex-view, context-menu-view (JS-порт на Reanimated,
синглтон Host в App.tsx), image-viewing (свой fullscreen-вьюер: Reanimated + **hook-API RNGH v3**
(`usePinchGesture`/`usePanGesture`/... — builder `Gesture.*` в v3 деприкейтнут) — pinch с
фокальной привязкой/rubber за maxScale/ре-анкеровкой при смене пальцев, pan c инерцией,
double-tap в точку, swipe-to-dismiss; SRP-разделение: `use-zoom-gesture` (только зум),
`use-dismiss-gesture` (только смахивание, собственный translateY), `use-viewer-gestures`
(композиция + animatedStyle + reset); кастомизация render-пропсами
renderHeader/renderFooter/renderImage; FastImage + previewUri + префетч соседних),
keyboard-scroll-view, actions,
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
Notifications, Modals, Dialogs, Pickers, Ticket.
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

Chat: `widgets/chat-room/` — `ChatRoom.tsx` (мок-данные, `useChatRoomMock`).
ChatView/InputBar — `shared/ui/chat-view`, `shared/ui/input-bar` (iOS → native, иначе JS-порты).
