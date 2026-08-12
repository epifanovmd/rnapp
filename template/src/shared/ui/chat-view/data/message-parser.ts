import type { ChatContentRegistry } from "../content";
import { ChatAction, ChatMessage } from "../types";
import {
  IParsedChatMessage,
  parseChatMessage,
  resolveChatActions,
} from "./chat-message";

/** Действия равны, если совпадают по полям — хост часто строит их заново. */
const actionsEqual = (a: ChatAction[], b: ChatAction[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];

    if (left === right) continue;
    if (
      left.id !== right.id ||
      left.title !== right.title ||
      left.systemImage !== right.systemImage ||
      left.isDestructive !== right.isDestructive
    ) {
      return false;
    }
  }

  return true;
};

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
    // Действия считает хост, и смена колбэка (в т.ч. инлайн-стрелка на каждый
    // рендер) их инвалидирует. Но дорогая часть разбора — медиа, ссылки,
    // эмодзи — от колбэка не зависит, поэтому кеш не сбрасывается: действия
    // пересчитываются поверх готового разбора, и объект заменяется, только
    // если они реально изменились. Идентичность неизменного сохраняется.
    const actionsStale = this._getActions !== getActionsForMessage;

    this._getActions = getActionsForMessage;

    const next = new Map<ChatMessage, IParsedChatMessage>();
    const result: IParsedChatMessage[] = new Array(messages.length);

    let isSorted = true;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let parsed = this._cache.get(message);

      if (!parsed) {
        parsed = parseChatMessage(
          message,
          this._contentTypes,
          getActionsForMessage?.(message),
        );
      } else if (actionsStale) {
        const actions = resolveChatActions(
          message,
          getActionsForMessage?.(message),
        );

        if (!actionsEqual(parsed.actions, actions)) {
          parsed = { ...parsed, actions };
        }
      }

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
