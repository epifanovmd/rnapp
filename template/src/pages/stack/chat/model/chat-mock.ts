import { IChatMessage, MessageContent } from "@entities/message";

/**
 * Тестовая переписка: сто сообщений за три дня.
 *
 * Всё считается детерминированно от порядкового номера — прогоны сравнимы
 * между собой, а раскладка списка повторяется от запуска к запуску.
 */

export const MOCK_MESSAGE_COUNT = 100;

const AUTHORS = [
  { id: "u1", name: "Аня" },
  { id: "u2", name: "Борис" },
  { id: "u3", name: "Вера" },
];

const OWN_AUTHOR = { id: "me", name: "Я" };

const TEXTS = [
  "Привет! Как продвигается задача?",
  "Готово, залил в ветку — посмотри, когда будет время.",
  "Тут длинное сообщение, чтобы строки в списке были разной высоты и было видно, как список считает раскладку по измерениям, а не по оценке.",
  "Ок",
  "Созвон в 15:00 — успеешь?",
  "Скинул логи, ошибка воспроизводится только на релизной сборке.",
  "Договорились 👍",
];

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Шаг между сообщениями: сотня укладывается примерно в три дня. */
const STEP = 42 * MINUTE;

const contentOf = (seq: number): MessageContent =>
  seq % 17 === 5
    ? {
        kind: "image",
        url: `https://picsum.photos/seed/chat${seq}/600/400`,
        caption: seq % 34 === 5 ? "Скриншот с прода" : undefined,
      }
    : { kind: "text", text: TEXTS[seq % TEXTS.length]! };

const createMockMessage = (seq: number, startedAt: number): IChatMessage => {
  const isOwn = seq % 3 === 2;
  const author = isOwn ? OWN_AUTHOR : AUTHORS[seq % AUTHORS.length]!;

  return {
    id: `m${seq}`,
    content: contentOf(seq),
    authorId: author.id,
    authorName: author.name,
    isOwn,
    createdAt: startedAt + seq * STEP,
    // Каждое седьмое отвечает на сообщение тремя строками выше.
    replyToId: seq % 7 === 0 && seq > 3 ? `m${seq - 3}` : undefined,
    isEdited: seq % 23 === 0,
  };
};

export const createMockMessages = (
  count: number = MOCK_MESSAGE_COUNT,
  now: number = Date.now(),
): IChatMessage[] => {
  const startedAt = now - (count - 1) * STEP - 2 * DAY;

  return Array.from({ length: count }, (_, index) =>
    createMockMessage(index, startedAt),
  );
};
