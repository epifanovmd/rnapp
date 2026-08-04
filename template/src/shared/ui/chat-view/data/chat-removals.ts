import { IParsedChatMessage } from "./chat-message";
import { chatMessageRowKey } from "./chat-rows";

/**
 * Больше сообщений за одно обновление — это не удаление, а массовая замена
 * данных: смена чата, перезагрузка, обрезка страницы. Такое не анимируется:
 * список платил бы пересчётом позиций за каждую исчезающую строку.
 */
export const CHAT_MAX_ANIMATED_REMOVALS = 5;

export interface IChatRemovalsResult {
  /** Сообщения для строк: вход плюс те, что доигрывают исчезновение. */
  messages: IParsedChatMessage[];
  /** Ключи строк, доигрывающих исчезновение; `null` — таких нет. */
  removingKeys: ReadonlySet<string> | null;
}

const byTimestamp = (a: IParsedChatMessage, b: IParsedChatMessage): number =>
  a.timestamp - b.timestamp;

/** Слияние двух отсортированных списков; при равном времени вход идёт первым. */
const merge = (
  messages: IParsedChatMessage[],
  removed: IParsedChatMessage[],
): IParsedChatMessage[] => {
  const result: IParsedChatMessage[] = new Array(
    messages.length + removed.length,
  );

  let i = 0;
  let j = 0;

  while (i < messages.length && j < removed.length) {
    result[i + j] =
      messages[i].timestamp <= removed[j].timestamp
        ? messages[i++]
        : removed[j++];
  }

  while (i < messages.length) result[i + j] = messages[i++];
  while (j < removed.length) result[i + j] = removed[j++];

  return result;
};

/**
 * Сообщения, пропавшие из входа, но ещё нужные списку.
 *
 * Хост убирает удалённое сообщение из массива — строка исчезла бы тем же
 * кадром, вместе с рывком соседей на её место. Трекер задерживает такое
 * сообщение: строка остаётся на месте помеченной исчезающей и снимается,
 * когда анимация доиграла.
 *
 * Сверка идёт по ключу строки, а не по `id`: у отправляемого сообщения ключ
 * держится за `localId`, и подмена `id` сервером не выглядит удалением.
 */
export class ChatRemovalTracker {
  private _source: IParsedChatMessage[] | null = null;
  private _removed = new Map<string, IParsedChatMessage>();
  private _result: IChatRemovalsResult = { messages: [], removingKeys: null };

  /** Ключи строк, доигрывающих исчезновение. */
  get removingKeys(): ReadonlySet<string> | null {
    return this._result.removingKeys;
  }

  /** Сверить новый вход с предыдущим и вернуть список для строк. */
  sync(
    messages: IParsedChatMessage[],
    maxAnimated: number,
  ): IChatRemovalsResult {
    if (this._source === messages) return this._result;

    const previous = this._source;

    this._source = messages;

    if (previous) this._collect(previous, messages, maxAnimated);

    return this._rebuild();
  }

  /** Снять строку по завершении анимации. `true` — список нужно пересобрать. */
  finish(key: string): boolean {
    if (!this._removed.delete(key)) return false;

    this._rebuild();

    return true;
  }

  /** Сбросить всё без анимации. */
  reset(): boolean {
    if (this._removed.size === 0) return false;

    this._removed.clear();
    this._rebuild();

    return true;
  }

  private _collect(
    previous: IParsedChatMessage[],
    next: IParsedChatMessage[],
    maxAnimated: number,
  ): void {
    const nextKeys = new Set<string>();

    for (const message of next) nextKeys.add(chatMessageRowKey(message));

    // Сообщение вернулось (отмена удаления) — анимацию нужно прервать.
    for (const key of this._removed.keys()) {
      if (nextKeys.has(key)) this._removed.delete(key);
    }

    const removed: IParsedChatMessage[] = [];

    for (const message of previous) {
      const key = chatMessageRowKey(message);

      if (!nextKeys.has(key) && !this._removed.has(key)) removed.push(message);
    }

    if (removed.length === 0) return;

    if (removed.length + this._removed.size > maxAnimated) {
      this._removed.clear();

      return;
    }

    for (const message of removed) {
      this._removed.set(chatMessageRowKey(message), message);
    }
  }

  private _rebuild(): IChatRemovalsResult {
    const messages = this._source ?? [];

    // Обычный случай — идентичность входа сохраняется, и строки не пересобираются.
    if (this._removed.size === 0) {
      this._result = { messages, removingKeys: null };

      return this._result;
    }

    const removed = [...this._removed.values()].sort(byTimestamp);

    this._result = {
      messages: merge(messages, removed),
      removingKeys: new Set(this._removed.keys()),
    };

    return this._result;
  }
}
