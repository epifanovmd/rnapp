---
module: entities/message
summary: Сообщение переписки — модель, реестр видов содержимого и UI пузыря, цитаты и разделителя даты.
---

# message

Домен одного сообщения: тип `IChatMessage`, разбор содержимого по виду и его представление.
Лента, группировка по дням и действия — выше, в `widgets/chat` и `features/message-actions`.

## Public API

| Экспорт                                                             | Что                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `IChatMessage`, `MessageContent`, `MessageContentOf`, `MessageKind` | модель: `text` или `image` (`url`, `caption?`)               |
| `messagePreview`, `isMessageEditable`, `messageEditableText`        | сводка одной строкой; правится ли текстом; текст для правки  |
| `MessageBubble`, `IMessageBubbleProps`                              | пузырь: автор (чужое), цитата, содержимое, время, «изменено» |
| `MessageQuote`, `IMessageQuoteProps`                                | цитата: полоса, автор, одна строка                           |
| `MessageDayDivider`, `IMessageDayDividerProps`                      | пилюля с готовой подписью дня                                |
| `useMessageColors`, `IMessageColors`                                | палитра «своё / чужое»                                       |
| `formatMessageTime`                                                 | `HH:mm`                                                      |

## Устройство

- `ui/MessageContentView.tsx` — реестр `MESSAGE_CONTENTS`: для каждого вида `View`, `preview`,
  `isEditable`. Новый вид — ветка в `MessageContent`, компонент в `ui/contents/` и строка в
  реестре; список, цитаты и панель ответа не меняются.
- `useMessageColors(isOwn)` — единственное место, где своё отличается от чужого; отдаёт готовые
  цвета, а не имена токенов.

## Зависимости

- `@shared/lib/theme`, `@shared/ui` (`getTextStyle`, `Image`), `date-fns`.
- Используется: `widgets/chat`, `features/message-actions`, `pages/stack/chat` (мок данных).

## Gotcha

- Пузырь и цитата — на примитивах RN со статическими стилями: строка пересобирается на каждой
  переработке контейнера списка, лишний объект стиля даёт новый замер строки.
- Подсветка в `MessageBubble` — слой поверх фона, не рамка: рамка меняла бы высоту строки, по
  которой список считает раскладку.
- `messageEditableText` знает только вид `text` напрямую, мимо реестра.
