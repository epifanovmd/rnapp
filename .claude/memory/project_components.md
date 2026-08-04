---
name: Components Library
description: UI-кит shared/ui, widgets/chat-room, compound components через slots
type: project
---

Весь UI — в `src/shared/ui/` (кроме `TabBar` в `widgets/app-shell/`):
layout, navbar (compound: BackButton/Title/Subtitle/Right...), button, input (+TextField),
bottom-sheet (@gorhom), dialog (Dialog.Host в App.tsx), text, icon (lucide), picker (нативный
WheelPicker), chart (Skia), carousel, flex-view, context-menu-view (JS-порт на Reanimated,
синглтон Host в App.tsx), image-viewing, keyboard-scroll-view, actions, animated-refreshing,
check-box, chip, collapsable, field, image, scroll-view, switch, tabs, ticket, title, touchable.

**Compound-компоненты — через slots**: `createSlot` + `useSlotProps(Component, children)`
(`shared/lib/slots/slots.ts`). Пример — `shared/ui/navbar/Navbar.tsx`.

Chat: `widgets/chat-room/` — `ChatRoom.tsx` (мок-данные, `useChatRoomMock`).
ChatView/InputBar — `shared/ui/chat-view`, `shared/ui/input-bar` (iOS → native, иначе JS-порты).
