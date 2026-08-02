/**
 * Детекция ссылок и телефонов в тексте сообщения.
 *
 * Живёт в утилитах, а вызывается на этапе разбора сообщения (`data/`): регулярки
 * по тексту стоят дорого, и прогонять их на каждый рендер ячейки нельзя.
 */

export interface IChatTextSegment {
  text: string;
  /** Ссылка сегмента: `https://…` либо `tel:…`. Пусто — обычный текст. */
  url?: string;
}

const URL_RE = /(?:https?:\/\/|www\.)[^\s<]+/gi;
const PHONE_RE = /\+?\d[\d\-() ]{7,}\d/g;

/**
 * Разбивает текст на сегменты со ссылками. Возвращает `null`, если ссылок нет —
 * вызывающий рисует текст одной строкой без промежуточных `<Text>`.
 */
export const detectChatLinks = (text: string): IChatTextSegment[] | null => {
  const matches: { start: number; end: number; url: string }[] = [];

  for (const match of text.matchAll(URL_RE)) {
    const value = match[0];
    const start = match.index ?? 0;

    matches.push({
      start,
      end: start + value.length,
      url: value.startsWith("http") ? value : `https://${value}`,
    });
  }

  for (const match of text.matchAll(PHONE_RE)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    // Номер внутри уже найденной ссылки — не ссылка.
    if (matches.some(m => start < m.end && end > m.start)) continue;

    matches.push({
      start,
      end,
      url: `tel:${match[0].replace(/[\s\-()]/g, "")}`,
    });
  }

  if (matches.length === 0) return null;

  matches.sort((a, b) => a.start - b.start);

  const segments: IChatTextSegment[] = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start) });
    segments.push({ text: text.slice(m.start, m.end), url: m.url });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return segments;
};
