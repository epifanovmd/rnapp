---
name: Native Modules (iOS & Android)
description: Кастомные нативные модули — ChatView, ContextMenu, WheelPicker, конфигурация iOS/Android
type: project
---

## iOS (template/ios/)

### AppDelegate.swift
- Swift, `@main` class, RCTReactNativeFactory
- RNBootSplash.initWithStoryboard("BootSplash")
- Deep linking: RCTLinkingManager (open URL + universal links)

### Podfile
- Firebase/Core + Firebase/Messaging (modular headers)
- DifferenceKit (для ChatView diffing)
- react-native-config (env)
- react-native-permissions: только Notifications включено

### Native Modules

**ChatView** (`ios/ChatView/`) — ~40 Swift файлов
- Bridge: `RNChatView.swift`, `RNChatViewManager.swift`
- Controller: `ChatViewController` с расширениями (inputbar, scrolling, keyboard, collection delegate, updates, datasource)
- Views: `MessageBubbleView`, `MessageCell`, `DateSeparatorCell`, `InputBarView`, `MessageStatusView`, `ReplyPreviewView`, `MessageContentViews`
- Core: `ChatModels`, `ChatParsing`, `KeyboardListener`, `DateHelper`
- Layout: `ChatLayoutConstants`, `MessageSizeCalculator`, `MessageSizeCache`
- Theme: `ChatTheme`
- Cache: `ImageCache`

**ContextMenu** (`ios/ContextMenu/`) — 9 Swift файлов
- Bridge: `RNContextMenuView.swift`, `RNContextMenuViewManager.swift`
- Controller: `ContextMenuViewController`
- Views: `ContextMenuActionsView`, `ContextMenuEmojiPanel`
- Layout: `ContextMenuAnimator`, `ContextMenuLayout`
- Models: `ContextMenuModels`
- Theme: `ContextMenuTheme`

### Build Schemes
- 3 env: development, staging, production
- react-native-config для env variables per scheme

---

## Android (template/android/)

### MainApplication.kt
- Kotlin, регистрация нативных пакетов:
  - `RnWheelPickerPackage()`
  - `RNChatViewPackage()`
  - `RNContextMenuViewPackage()`

### MainActivity.kt
- RNBootSplash.init (R.style.BootTheme)
- Fabric enabled

### AndroidManifest.xml
- Permissions: INTERNET, VIBRATE, RECEIVE_BOOT_COMPLETED, CAMERA, WRITE_EXTERNAL_STORAGE
- Deep linking: scheme из `@string/DEEPLINK_BASE_URL`
- cleartext traffic configurable

### Native Modules

**rnchatview** (`android/.../rnchatview/`) — ~16 Kotlin файлов
- Bridge: `RNChatView.kt`, `RNChatViewManager.kt`, `RNChatViewPackage.kt`
- `ChatAdapter.kt` — RecyclerView adapter
- `ChatModels.kt`, `ChatParsing.kt`, `ChatTheme.kt`
- `ChatLayoutConstants.kt`, `ChatUpdateStrategy.kt`
- `MessageBubbleView.kt`, `InputBarView.kt`, `InputBarTopPanel.kt`, `InputBarDrawables.kt`, `InputBarContract.kt`
- `ChatViewWidgets.kt`, `DateHelper.kt`, `ImageLoader.kt`

**rncontextmenu** (`android/.../rncontextmenu/`) — 6 Kotlin файлов
- `RNContextMenuView.kt`, `RNContextMenuViewManager.kt`, `RNContextMenuViewPackage.kt`
- `ContextMenuView.kt`, `ContextMenuModels.kt`, `ContextMenuLayoutEngine.kt`

**rnwheelpicker** (`android/.../rnwheelpicker/`) — 5 Java файлов
- `RnWheelPickerPackage.java`, `RnWheelPickerModule.java`, `Picker.java`
- `wheelpicker/WheelPicker.java`, `wheelpicker/IWheelPicker.java`
- `events/ItemSelectedEvent.java`

### Build Variants
- 3 env: development, staging, production (envConfigFiles в build.gradle)
- Version code из CI_BUILD_NUMBER
- APP_ID_ANDROID и DISPLAY_NAME из .env
- Hermes enabled

---

## JS Specs (Turbo Modules)
- `src/NativeChatViewSpec.ts` — codegen spec для ChatView
- `src/NativeContextMenuViewSpec.ts` — codegen spec для ContextMenu
