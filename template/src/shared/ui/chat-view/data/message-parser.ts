import type { ChatContentRegistry } from "../content";
import { ChatAction, ChatMessage } from "../types";
import { IParsedChatMessage, parseChatMessage } from "./chat-message";

/**
 * Разбор входных сообщений с сохранением идентичности.
 *
 * `props.messages` приходит новым массивом на любое изменение. Наивный
 * `messages.map(parseChatMessage)` создаёт новый объект на **каждое** сообщение,
 * дальше новыми становятся все строки, и список перерисовывает все ячейки.
 * Здесь разобранный объект переиспользуется, пока не изменилось само входное
 * сообщение (сравнение по ссылке) — меняется одно, перерисовывается одно.
 *
 * Отсюда требование к хосту: он тоже обязан сохранять идентичность неизменённых
 * элементов `messages`.
 */
export class ChatMessageParser {
  private _cache = new Map<ChatMessage, IParsedChatMessage>();
  private _getActions: ((message: ChatMessage) => ChatAction[]) | undefined;
  private readonly _contentTypes: ChatContentRegistry;

  constructor(contentTypes: ChatContentRegistry) {
    this._contentTypes = contentTypes;
  }

  /** Разобрать список и отсортировать по времени. */
  parse(
    messages: ChatMessage[],
    getActionsForMessage?: (message: ChatMessage) => ChatAction[],
  ): IParsedChatMessage[] {
    // Действия считает хост и они могут зависеть от его состояния — сменился
    // колбэк, значит прежние разборы больше не годятся.
    if (this._getActions !== getActionsForMessage) {
      this._getActions = getActionsForMessage;
      this._cache.clear();
    }

    const next = new Map<ChatMessage, IParsedChatMessage>();
    const result: IParsedChatMessage[] = new Array(messages.length);

    let isSorted = true;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const parsed =
        this._cache.get(message) ??
        parseChatMessage(
          message,
          this._contentTypes,
          getActionsForMessage?.(message),
        );

      next.set(message, parsed);
      result[i] = parsed;

      if (i > 0 && result[i - 1].timestamp > parsed.timestamp) isSorted = false;
    }

    this._cache = next;

    // Типичный чат приходит упорядоченным, а `sort` на тысяче элементов — это
    // тысячи вызовов компаратора на каждое обновление.
    return isSorted ? result : result.sort(byTimestamp);
  }
}

const byTimestamp = (a: IParsedChatMessage, b: IParsedChatMessage): number =>
  a.timestamp - b.timestamp;
