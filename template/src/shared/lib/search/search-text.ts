/** Диапазон совпадения в исходном тексте: `[start, end)`. */
export type TMatchRange = [number, number];

/**
 * Посимвольная нормализация для поиска: нижний регистр, «ё» → «е». Длина
 * сохраняется — индексы совпадений годятся для исходного текста.
 */
export const normalizeSearchText = (text: string): string =>
  text.toLowerCase().replace(/ё/g, "е");

/** Слова запроса (нормализованные, без пустых). */
export const searchTokens = (query: string): string[] =>
  normalizeSearchText(query).split(/\s+/).filter(Boolean);

/** Текст содержит все слова запроса (в любом порядке). Пустой запрос — совпадает. */
export const matchesQuery = (text: string, query: string): boolean => {
  const normalized = normalizeSearchText(text);

  return searchTokens(query).every(token => normalized.includes(token));
};

/**
 * Все вхождения слов запроса в текст — для подсветки; пересекающиеся и
 * соседние диапазоны склеены, отсортированы по началу.
 */
export const findMatchRanges = (text: string, query: string): TMatchRange[] => {
  const normalized = normalizeSearchText(text);
  const ranges: TMatchRange[] = [];

  for (const token of searchTokens(query)) {
    let index = normalized.indexOf(token);

    while (index !== -1) {
      ranges.push([index, index + token.length]);
      index = normalized.indexOf(token, index + token.length);
    }
  }

  ranges.sort((a, b) => a[0] - b[0]);

  const merged: TMatchRange[] = [];

  for (const range of ranges) {
    const last = merged[merged.length - 1];

    if (last && range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
    } else {
      merged.push([range[0], range[1]]);
    }
  }

  return merged;
};

/** Части текста для подсветки: подряд идущие куски с флагом совпадения. */
export const splitByMatches = (
  text: string,
  query: string,
): { text: string; match: boolean }[] => {
  const parts: { text: string; match: boolean }[] = [];
  let cursor = 0;

  for (const [start, end] of findMatchRanges(text, query)) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false });
    parts.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }

  if (cursor < text.length || parts.length === 0) {
    parts.push({ text: text.slice(cursor), match: false });
  }

  return parts;
};

/**
 * Элементы, где все слова запроса нашлись в совокупности полей (`fields` —
 * тексты элемента: имя, описание…). Пустой запрос — все элементы.
 */
export const filterByQuery = <T>(
  items: readonly T[],
  query: string,
  fields: (item: T) => (string | null | undefined)[],
): T[] => {
  const tokens = searchTokens(query);

  if (tokens.length === 0) return [...items];

  return items.filter(item => {
    const haystack = normalizeSearchText(fields(item).filter(Boolean).join(" "));

    return tokens.every(token => haystack.includes(token));
  });
};

/**
 * История запросов: новый — первым, повтор (без учёта регистра и «ё»)
 * поднимается наверх, пустые не сохраняются, не больше `max`.
 */
export const pushSearchHistory = (
  history: readonly string[],
  query: string,
  max: number,
): string[] => {
  const value = query.trim();

  if (!value) return [...history];

  const key = normalizeSearchText(value);

  return [
    value,
    ...history.filter(item => normalizeSearchText(item) !== key),
  ].slice(0, max);
};
