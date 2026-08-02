import { IParsedChatMessage } from "./chat-message";

/**
 * Хвост, дописанный в конец списка с прошлого снимка.
 *
 * Это всё, что осталось от диффа сообщений. Раньше здесь была таблица из шести
 * стратегий обновления (`prepend` / `append` / `structural` / …) с ручным
 * восстановлением позиции скролла по якорям — теперь позицию держит сам список
 * (`maintainVisibleContentPosition` + `maintainScrollAtEnd`), и от диффа нужен
 * ровно один ответ: какие чужие сообщения приехали снизу, чтобы посчитать
 * непрочитанные.
 */
export const appendedIncomingIds = (
  previous: IParsedChatMessage[],
  next: IParsedChatMessage[],
): string[] => {
  if (previous.length === 0 || next.length <= previous.length) return [];

  const previousIds = new Set(previous.map(message => message.id));
  const appended: string[] = [];

  // Идём с конца, пока сообщения не было в прошлом снимке: так хвост находится
  // и когда выше по списку что-то поменялось.
  for (let i = next.length - 1; i >= 0; i--) {
    const message = next[i];

    if (previousIds.has(message.id)) break;
    if (message.ownership === "theirs") appended.push(message.id);
  }

  return appended;
};
