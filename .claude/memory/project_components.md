---
name: Components Library
description: UI-кит shared/ui, widgets/chat-room, compound components via slots
type: project
---

Всё UI — в `src/shared/ui/` (кроме `TabBar` в `widgets/app-shell/`):
layouts/, navbar/ (compound: BackButton/Title/Subtitle/Right...), button/, input/ (+TextField),
bottom-sheet/ (@gorhom), dialog/ (DialogHost в App.tsx), text/, icon/ (lucide), picker/ (на native
WheelPicker), chart/ (Skia, без общего theme), carousel/, flex-view/, context-menu-view/ (JS-порт на
Reanimated, singleton Host в App.tsx), image-viewing/, keyboard-scroll-view/, ...

**Compound-компоненты — через slots**: `createSlot` + `useSlotProps(Owner, children)`
(`shared/lib/slots`); пример — `shared/ui/navbar/Navbar.tsx`.

Chat: `widgets/chat-room/` — `ChatRoom.tsx` (мок-данные, `useChatRoomMock`),
`native/map-message-to-native.ts`. ChatView/InputBar — `shared/ui/chat-view`, `shared/ui/input-bar`
(iOS → native, иначе JS-порты).

Подробности — прямо в коде: `src/shared/ui/`, `src/widgets/chat-room/`.
