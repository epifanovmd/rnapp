/**
 * Скрытые ключи, приведённые к текущему набору: неизвестные отбрасываются,
 * а если скрыто всё — видны все (последнюю серию скрыть нельзя).
 */
export const normalizeHiddenKeys = (
  hidden: ReadonlySet<string>,
  keys: readonly string[],
): ReadonlySet<string> => {
  const next = new Set(keys.filter(key => hidden.has(key)));

  if (next.size >= keys.length) next.clear();

  // next ⊆ hidden: равный размер — тот же набор, ссылка сохраняется.
  return next.size === hidden.size ? hidden : next;
};

/** Можно ли переключить ключ: последнюю видимую серию выключить нельзя. */
export const canToggleKey = (
  hidden: ReadonlySet<string>,
  keys: readonly string[],
  key: string,
): boolean => {
  if (!keys.includes(key)) return false;
  if (hidden.has(key)) return true;

  return keys.some(item => item !== key && !hidden.has(item));
};

/** Переключение видимости ключа; запрещённое переключение не меняет набор. */
export const toggleHiddenKey = (
  hidden: ReadonlySet<string>,
  keys: readonly string[],
  key: string,
): ReadonlySet<string> => {
  if (!canToggleKey(hidden, keys, key)) return hidden;

  const next = new Set(hidden);

  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }

  return next;
};
