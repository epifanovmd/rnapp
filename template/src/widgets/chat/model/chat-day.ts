import { differenceInCalendarDays, format, parseISO } from "date-fns";

/**
 * Группировка переписки по дням.
 *
 * Ключ дня и его подпись — свойство списка, а не отдельного сообщения:
 * разделители существуют только там, где сообщения выстроены в ленту.
 */

/** Ключ дня: по нему сообщения собираются под один разделитель. */
export const messageDayKey = (createdAt: number): string =>
  format(createdAt, "yyyy-MM-dd");

/**
 * Подпись разделителя: сегодня, вчера или дата целиком.
 *
 * `now` параметром, а не изнутри: подпись зависит от текущего дня, и без явного
 * «сейчас» её нельзя ни проверить, ни пересчитать при смене суток.
 */
export const formatChatDay = (
  dayKey: string,
  now: number = Date.now(),
): string => {
  const day = parseISO(dayKey);
  const diff = differenceInCalendarDays(day, now);

  if (diff === 0) return "Сегодня";
  if (diff === -1) return "Вчера";

  return format(day, "dd.MM.yyyy");
};
