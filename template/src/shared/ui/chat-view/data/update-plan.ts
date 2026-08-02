import { IParsedChatMessage } from "./chat-message";
import {
  buildPendingMapping,
  deletedMessageIds,
  IPendingMapping,
  isAppendOnly,
  isPrependOnly,
} from "./message-diff";

/**
 * Классификация обновления списка — порт роутера `MessageUpdateHandler.update`.
 *
 * Эталон выбирает стратегию **до** того, как тронет данные, потому что от неё
 * зависит поведение скролла. Здесь та же таблица решений, но чистой функцией.
 *
 * | Стратегия    | Условие                       | Скролл                     |
 * |--------------|-------------------------------|----------------------------|
 * | `initial`    | старых сообщений не было      | к якорю либо в конец       |
 * | `clear`      | новых сообщений нет           | сбрасывается               |
 * | `prepend`    | добавлено только сверху       | держим позицию (MVCP)      |
 * | `append`     | добавлено только снизу        | вниз, если были внизу      |
 * | `content`    | структура та же, иное наполн. | нижняя привязка            |
 * | `structural` | вставки/удаления/перестановки | восстановление по якорям   |
 */

export type ChatUpdateStrategy =
  "initial" | "clear" | "prepend" | "append" | "content" | "structural";

export interface IChatUpdatePlan {
  strategy: ChatUpdateStrategy;
  /** Сколько сообщений добавлено (для `prepend` / `append`). */
  addedCount: number;
  /** ID удалённых сообщений — для эффекта распада. */
  deletedIds: Set<string>;
  /** Соответствие pending → real по общему `localId`. */
  pendingMapping: IPendingMapping;
}

/** Есть ли вставки/удаления/перестановки (pending→real таковой не считается). */
const hasStructuralChange = (
  old: IParsedChatMessage[],
  next: IParsedChatMessage[],
  pendingMapping: IPendingMapping,
): boolean => {
  if (old.length !== next.length) return true;

  for (let i = 0; i < old.length; i++) {
    const oldId = old[i].id;
    const nextId = next[i].id;

    if (oldId === nextId) continue;
    if (pendingMapping.oldToNew.get(oldId) === nextId) continue;

    return true;
  }

  return false;
};

/** Выбрать стратегию обновления по старому и новому спискам сообщений. */
export const planChatUpdate = (
  old: IParsedChatMessage[],
  next: IParsedChatMessage[],
): IChatUpdatePlan => {
  const pendingMapping = buildPendingMapping(old, next);

  // Длины равны и id на своих местах — удалений быть не может (реакция, голос
  // в опросе, смена статуса). Экономит три прохода по массиву на обновление.
  const sameIdsInOrder =
    old.length === next.length &&
    old.every((message, i) => message.id === next[i].id);
  const deletedIds =
    !sameIdsInOrder && old.length > 0
      ? deletedMessageIds(old, next)
      : new Set<string>();

  if (old.length === 0) {
    return {
      strategy: "initial",
      addedCount: next.length,
      deletedIds,
      pendingMapping,
    };
  }

  if (next.length === 0) {
    return { strategy: "clear", addedCount: 0, deletedIds, pendingMapping };
  }

  if (isPrependOnly(old, next)) {
    return {
      strategy: "prepend",
      addedCount: next.length - old.length,
      deletedIds,
      pendingMapping,
    };
  }

  if (isAppendOnly(old, next)) {
    return {
      strategy: "append",
      addedCount: next.length - old.length,
      deletedIds,
      pendingMapping,
    };
  }

  return {
    strategy: hasStructuralChange(old, next, pendingMapping)
      ? "structural"
      : "content",
    addedCount: Math.max(0, next.length - old.length),
    deletedIds,
    pendingMapping,
  };
};

/**
 * Откладывать ли обновление до конца скролла. Порт проверки в `updateMessages`:
 * структурные изменения дёргают контент под пальцем, а `append`/`prepend`/
 * `content` сами управляют позицией и безопасны.
 */
export const shouldDeferUpdate = (plan: IChatUpdatePlan): boolean =>
  plan.strategy === "structural";
