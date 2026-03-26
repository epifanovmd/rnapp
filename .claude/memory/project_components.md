---
name: Components Library
description: Кастомные UI-компоненты — compound components, slots, layouts, нативные обёртки
type: project
---

## Layouts (src/components/layouts/)
- `Container` — обёртка SafeAreaView
- `Content` — ScrollView wrapper
- `RefreshingContainer` — Pull-to-refresh wrapper
- `StatusBar` — настройка StatusBar

## Navbar (src/components/navbar/) — compound component
- `Navbar` — основной компонент
- Slots: `Title`, `BackBtn`, `IconLeft`, `IconRight`, `HiddenBar`, `ImageBar`
- Использует `createSlot` + `useSlotProps`

## UI Primitives (src/components/ui/)
- `Button` — variants, loading state
- `Input`, `TextField` — text input с mergeRefs
- `BottomSheet` — @gorhom/bottom-sheet wrapper (compound: Content, Footer, Backdrop)
- `Dialog` — DialogHost + Dialog component
- `Touchable` — haptic feedback wrapper
- `Text` — типографика с theme
- `Icon` — lucide-react-native + custom icons
- `CheckBox`, `Chip`, `Switch`, `Tabs`
- `Field` — form field wrapper (compound)
- `ScrollView` — enhanced scroll
- `Image` — FastImage wrapper
- `Picker` — Date, Range, Time, Year pickers

## Chat (src/components/chat/)
- `Chat` — основной компонент (JS-side, оборачивает нативный ChatView)
- `ChatBubble`, `ChatMessage`, `ChatInputToolbar`
- `ChatReplyBar`, `ChatMessageContent`, `ChatTypingAnimation`
- Нативная реализация: iOS (Swift) + Android (Kotlin)

## FlexView (src/components/flexView/)
- CSS-like flex свойства в React Native
- `createFlexViewComponent` — HOC для любого View
- Style converters: shadow, border, flex props

## Other
- `Carousel` — carousel с Reanimated
- `HoldItemMenu` — long-press context menu
- `ImageViewing` — gallery viewer (double-tap zoom, pan)
- `Collapsable` — collapsible section
- `AnimatedRefreshing` — animated pull-to-refresh
- `TabBar` — custom bottom tab bar
- `Ticket` — card-style component
- `SwitchTheme`, `NavLink` (actions/)
