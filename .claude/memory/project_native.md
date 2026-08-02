---
name: Native Modules (iOS & Android)
description: Нативные модули и JS-порты чата; load-bearing правила keyboard compensation
type: project
---

## Что есть (сверено с `ios/` и `android/`)
- **ChatView / InputBar / ContextMenu — тонкие iOS-бриджи** (`ios/{ChatView,InputBar,ContextMenu}/Bridge/`,
  3 файла каждый). Реальный UI — во внешнем поде **`IOSChatView`**
  (`ios/Podfile`: `pod 'IOSChatView', :path => '../../../rn-chat-view'` — sibling repo, вне этого репо).
  **Android-native нет** — на Android/non-iOS JS-порты `JsChatView`/`JsInputBar`/`JsContextMenuView`.
- **Picker/WheelPicker — на обеих платформах**: iOS `ios/Picker/` (6 Obj-C), Android
  `rnwheelpicker/` (6 Java) — единственный зарегистрированный пакет в `MainApplication.kt`.
- **InputBar не самосайзится**: Fabric legacy-view не спрашивает `intrinsicContentSize` → Yoga даёт 0;
  высота приходит через `onHeightChange` (**хост обязан применить её к style**). Рост — сразу, сжатие —
  с задержкой 0.3s (pod анимирует 0.25/0.2s).
- **Fabric-спеки** (имена фиксированы RN, не переименовывать): `NativeChatViewSpec`/`NativeInputBarSpec`/
  `NativeContextMenuViewSpec`; `codegenConfig` name `"RNChatViewSpec"`, `jsSrcsDir: "src"`.

## JS-архитектура чата (`shared/ui/chat-view/`)
Слои строго вниз: `types → utils → config → data → services → model → hooks → components`.
- `model/` — контекст чата и стор подсветки. Не рисуют, поэтому лежат отдельно от
  `components/`: их читают и хуки тоже, а хуки — слой ниже.
- **Позиционирование делает LegendList, а не JS** (v3.3.3). Слоя `scroll/` больше нет: якоря,
  плавающая дата, доли видимости и пагинация раньше считались вручную по геометрии — теперь это
  штатные механизмы списка (см. таблицу ниже). Не возвращать ручные аналоги.
- `config/chat-styles.ts` — `createChatStyles(theme, layout)` прекомпилит готовые стили ячейки.
- `config/`: `IChatLayout` — только метрики чата; метрики панели ввода живут в `input-bar`
  (`IInputBarLayout`). Плоский проп `layout` раскладывается на две части в `resolveChatLayout`.
- `data/` — разбор один раз + **кеш идентичности** (`message-parser.ts`, `chat-rows.ts`): список
  перерисовывает только изменившиеся строки. Хост обязан сохранять identity сообщений.
- `hooks/` — по хуку на ответственность; LegendList-aware только `useChatCommands`/`useChatScrollReport`.

- **`features.disintegrationEnabled` — только iOS.** `JsChatView` его игнорирует: эффект распада
  снят при рефакторинге (measureInWindow + отложенный коммит данных ради выключенной по умолчанию
  анимации). На Android/non-iOS сообщение удаляется без анимации. Тумблер в `ChatSettingsModal`
  подписан «(только iOS)».

### Что отдано списку (не писать руками заново)
| Задача | Механизм LegendList |
|---|---|
| FAB, «мы внизу», позиция плашки | `sharedValues={{ scrollOffset, isNearEnd, activeStickyIndex }}` → читается в ворклетах |
| Плавающая дата | `stickyHeaderIndices` + `stickyHeaderConfig.offset`; автоскрытие — `useAnimatedReaction` в `useChatStickyDate` |
| Видимость / прочитано | `viewabilityConfigCallbackPairs` (два порога: 80% и 50%) |
| Пагинация | `onStartReached`/`onEndReached` + пороги в **долях экрана** (проп в px делится на высоту вьюпорта) |
| Позиция при вставках | `maintainVisibleContentPosition={{ data, size }}` |
| Автоскролл к новым | `maintainScrollAtEnd` + `maintainScrollAtEndThreshold` |
| Ширина списка в ячейке | `useListScrollSize()` внутри `MessageCell` |
- Аватары — статические внутри ячейки, метрики = нативные (sibling pod): `avatarColumn` — пустой
  спейсер (сдвигает пузырь как нативно: leading = cellHMargin + avatarSize + avatarLeadingMargin +
  avatarBubbleSpacing), а сам `ChatAvatar` — absolute (`avatarOverlay`: left = avatarLeadingMargin,
  низ = низ пузыря). Отступ аватар→пузырь = cellHMargin + avatarBubbleSpacing (10px при дефолтах);
  `showAvatar` — в `ChatRowsBuilder`. Слоя поверх списка нет.
- Пузырь mine/theirs имеет `minHeight: cellMinHeight - cellVSpacing` и заполняет content box ячейки
  (как нативно: bubble pinned top+bottom) — поэтому низ аватара всегда совпадает с низом пузыря.

## Keyboard compensation (`shared/lib/keyboard/`) — правила, которые нельзя регрессить
- **Один подписчик клавиатуры на экран**: `useKeyboardInset` + `useKeyboardScrollCompensation`.
- **Один источник сдвига**: `bottomInset` (shared value) двигает и бар, и зону списка. НЕ использовать
  `KeyboardChatScrollView`/`KeyboardAwareLegendList` (второй драйвер → список лагает; пробовали дважды).
- **Зона — спейсер в конце контента**, не `contentInset`; растёт по target-высоте. НЕ использовать
  `maintainScrollAtEnd:{on:{footerLayout:true}}` (layout-driven = второй источник). В `ChatList`
  разрешён только `on:{dataChange:true}` — `footerLayout`/`itemLayout` не включать.
- **Не транслейтить/сжимать контейнер списка** — верх контента уходит за clip bounds.
- **Freeze держит только content inset**, не бар (контекстное меню снимает пузырь); thaw — реакцией,
  когда живой инсет догонит (`shared/lib/hooks/use-freezable-value.ts`).
- **Interactive dismiss**: `onInteractive` per frame + не скроллить, пока палец на экране
  (`onScrollBeginDrag`/`onScrollEndDrag` — обязательная обвязка). Проверено пользователем.
- `scrollToMessage` центрирует по видимой области: `viewOffset = -viewPosition * getContentInset()`.
- JS-значения: `useKeyboardHeight.getHeight()`, `useKeyboardInset.getContentInset()`.

Читай: `template/ios/`, `template/android/`, `src/shared/ui/chat-view/`, `src/shared/lib/keyboard/`.
