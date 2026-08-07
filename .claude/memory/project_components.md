---
name: Components Library
description: UI-кит shared/ui, widgets/chat-room, compound components через slots
type: project
---

Весь UI — в `src/shared/ui/` (кроме `TabBar` в `widgets/app-shell/`):
layout, navbar (compound: BackButton/Title/Subtitle/Right...), button, input (+TextField),
bottom-sheet (@gorhom), balanced-row (три зоны, боковые уравнены по ширине — центр строго по
центру; используют Navbar, BottomSheetHeader и DialogHeader), dialog (compound
Dialog.Header/Content/Footer; управляемый `isVisible`/`onClose` или императивный через
`useDialogRef` → present/dismiss; логика в `dialog/hooks/` — visibility, animation,
animated-styles, gestures, back-button, styles; заменяемый `backdropComponent`; Portal +
Dialog.Host в App.tsx; свайп/бэкдроп/hardware-back, slide|fade|scale-анимации), text, icon (lucide), picker (нативный
WheelPicker), chart (Skia), carousel, flex-view, context-menu-view (JS-порт на Reanimated,
синглтон Host в App.tsx), image-viewing, keyboard-scroll-view, actions, animated-refreshing,
check-box, chip, collapsable, field, image, scroll-view, switch, tabs, ticket, title, touchable.

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
