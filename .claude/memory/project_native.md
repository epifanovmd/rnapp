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
- **Picker/WheelPicker** — на обеих платформах: iOS `ios/Picker/`, Android `rnwheelpicker/`.
- **Fabric-спеки**: `NativeChatViewSpec`/`NativeInputBarSpec`/`NativeContextMenuViewSpec`;
  `codegenConfig` name `"RNChatViewSpec"`, `jsSrcsDir: "src"`. Имена фиксированы RN.
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
