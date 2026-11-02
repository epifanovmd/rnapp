---
module: widgets/chat
summary: Экран переписки — список сообщений на AnchorList, панель ввода, меню действий, цитаты и сохранение позиции скролла.
---

# chat

`ChatView` показывает переписку и управляет вводом, но не знает, откуда сообщения: данные и их
изменения приходят пропами, поэтому виджет одинаково работает с моком и с сервером.

## Public API

| Экспорт                                 | Что                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ChatView`, `IChatViewProps`            | `chatId`, `messages`, `onSendMessage(text, replyToId?)`, `onEditMessage(id, text)`, `onDeleteMessage(id)`, `onLoadOlder?` |
| `buildChatRows`, `ChatRow`, `IChatRows` | сообщения → строки с разделителями дат + индексы разделителей                                                             |
| `chatRowKey`, `chatRowType`             | `keyExtractor` и `getItemType` строки                                                                                     |

## Устройство

`ui/ChatView.tsx` только собирает хуки `model/`:

- `chat-rows.ts` — строки `message | day`, `dayIndices` (якоря прилипания), `indexMessagesById`
  (поиск цитат), тип контейнера `message:<kind>`, фиксированная высота разделителя.
- `useChatComposer` — одно действие панели (ответ / правка / ничего), перевод вызовов `InputBar`
  в `onSendMessage`/`onEditMessage`. Удалили сообщение под действием — оно снимается
  (`isInputActionOrphaned`).
- `useChatListInset` — обёртка над `useInputBarInset`: `insetEnd` для AnchorList, подъём панели,
  живое перекрытие для кнопки «вниз»; `freeze`/`restore` на время контекстного меню.
- `useChatQuoteNavigation` — `scrollToKey` к цитате и подсветка на 2 с; `false`, если сообщения
  нет в данных.
- `useChatScrollRestore` — позиция в `IStorageService` по ключу `chat:scroll:<chatId>`: `end`
  или `{ key, offset }` верхней строки.
- `ChatList` — AnchorList: `recycleItems`, `alignItemsAtEnd`, `maintainScrollAtEnd` (только у
  конца), `maintainVisibleContentPosition` (`data` + `size`), sticky-разделители,
  `isWithinMaintainScrollAtEndThreshold` → `isAtEnd` для `ChatScrollToEndButton`.
- Чистые функции покрыты тестами `model/__tests__/` (дни, строки, позиция, действие панели).

## Зависимости

- `@entities/message` (`IChatMessage`, `MessageBubble`, `MessageDayDivider`, `messagePreview`,
  `messageEditableText`), `@features/message-actions` (`MessageActionsMenu`, `MessageActionId`).
- `@epifanovmd/anchor-list`, `@shared/ui/input-bar`, `@shared/lib/storage`, `@shared/lib/hooks`,
  `@react-navigation/native` (`useFocusEffect`), Reanimated.
- Используется: `pages/stack/chat` (данные — мок `useChatMessages`).

## Gotcha

- Позиция читается синхронно один раз (`initialScroll` к первому кадру) и пишется только при
  потере фокуса: на размонтировании ref списка уже очищен. Повтор того же значения отсекается.
- Низ переписки хранится состоянием `end`, а не строкой: к следующему открытию последняя строка
  уже не последняя, а ошибка оценок выше глубокой строки копится.
- `CHAT_ESTIMATED_ROW_SIZE` (96) нельзя занижать: от оценки считается стартовая позиция.
- Подсветка — через `extraData` (строка id, стабильный ключ), а не локальный state строки: при
  `recycleItems` state переработанного контейнера принадлежал бы прошлому сообщению.
- Пока открыто контекстное меню, отступ заморожен и фокус ввода снят: меню снимает снимок
  сообщения на его текущем месте.
- Нижний отступ — только через `insetEnd`; контейнер списка не транслейтить и не сжимать.
  Верхний отступ через `contentContainerStyle.paddingTop` AnchorList не учитывает в координатах
  (диапазон, sticky, `scrollToIndex` сместятся) — нужен `ListHeaderComponent`.
