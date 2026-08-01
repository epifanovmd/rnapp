import { ChatAction, ChatMessage } from "../types";
import { IParsedChatMessage, parseChatMessage } from "./chat-message";

/**
 * Разбор входных сообщений с сохранением идентичности.
 *
 * Зачем: `props.messages` приходит новым массивом на любое изменение — на
 * голос в опросе, на удаление одного сообщения, на смену статуса. Наивный
 * `messages.map(parseChatMessage)` создаёт новый объект **на каждое**
 * сообщение, и дальше по цепочке новыми становятся все строки списка, а
 * значит перерисовываются все смонтированные ячейки. На тысяче сообщений
 * это как раз та самая задержка после голосования.
 *
 * Здесь разобранный объект переиспользуется, пока не изменилось само
 * входное сообщение (сравнение по ссылке). Меняется одно сообщение —
 * новым становится ровно один разобранный объект, остальные 999 сохраняют
 * идентичность, и `LegendList` перерисовывает единственный контейнер
 * (`syncMountedContainer` сравнивает элементы по ссылке).
 *
 * Отсюда требование к хосту: он тоже обязан сохранять идентичность
 * неизменённых элементов `messages`. Пересоздавать весь массив мапом на
 * каждый рендер — значит обнулить весь этот кеш.
 */
export class ChatMessageParser {
  private _cache = new Map<ChatMessage, IParsedChatMessage>();
  private _getActions: ((message: ChatMessage) => ChatAction[]) | undefined;

  /**
   * Разобрать список и отсортировать по времени.
   *
   * Сортировка пропускается, если порядок уже верный: типичный чат приходит
   * упорядоченным, а `sort` на тысяче элементов — это тысячи вызовов
   * компаратора на каждое обновление.
   */
  parse(
    messages: ChatMessage[],
    getActionsForMessage?: (message: ChatMessage) => ChatAction[],
  ): IParsedChatMessage[] {
    // Действия считает хост, и они могут зависеть от его состояния —
    // сменился колбэк, значит прежние разборы больше не годятся.
    if (this._getActions !== getActionsForMessage) {
      this._getActions = getActionsForMessage;
      this._cache.clear();
    }

    const next = new Map<ChatMessage, IParsedChatMessage>();
    const result: IParsedChatMessage[] = new Array(messages.length);

    let isSorted = true;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let parsed = this._cache.get(message);

      if (!parsed) {
        parsed = parseChatMessage(message, getActionsForMessage?.(message));
      }

      next.set(message, parsed);
      result[i] = parsed;

      if (i > 0 && result[i - 1].timestamp > parsed.timestamp) {
        isSorted = false;
      }
    }

    this._cache = next;

    // `sort` стабилен, поэтому идентичность объектов переживает сортировку.
    return isSorted ? result : result.sort(byTimestamp);
  }
}

const byTimestamp = (a: IParsedChatMessage, b: IParsedChatMessage): number =>
  a.timestamp - b.timestamp;
