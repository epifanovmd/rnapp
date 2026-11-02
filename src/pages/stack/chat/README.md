---
module: pages/stack/chat
summary: Демо-переписка — моковые сообщения в памяти и ChatView из widgets/chat.
---

# chat

Экран переписки на моковых данных. Экран `Chat` корневого стека, группа `Private`,
заголовок — общий `AppHeader` (без `options.title`, показывается имя маршрута);
параметров нет. Deep link — `chat`. Открывается с вкладки Playground.

## Public API

| Экспорт | Что                           |
| ------- | ----------------------------- |
| `Chat`  | Компонент экрана (`observer`) |

## Устройство

- Тонкая композиция: `useChatMessages` (данные и действия) → `ChatView`
  (`chatId`, `messages`, `onSendMessage`, `onEditMessage`, `onDeleteMessage`).
- `model/useChatMessages.ts` — сообщения в `useState`: отправка (id `own:<n>`), правка
  текстовых (`isEdited`), удаление. Здесь же место будущих запросов и сокета — `ChatView`
  видит только массив и колбэки.
- `model/chat-mock.ts` — 100 детерминированных сообщений за ~3 дня от номера: три автора
  и свои, картинки (picsum), ответы, правки.
- `Container edges={[]}`: снизу safe area учитывает панель ввода, сверху — хедер.

## Зависимости

- `@widgets/chat` — `ChatView`; `@entities/message` — `IChatMessage`, `MessageContent`.
- `@shared/ui` (`Container`).

## Gotcha

- `CHAT_ID = "demo"` — ключ, под которым `ChatView` сохраняет позицию скролла (MMKV);
  при смене ключа сохранённая позиция теряется.
