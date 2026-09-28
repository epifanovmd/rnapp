import dayjs from "dayjs";

/**
 * Группировка переписки по дням.
 *
 * Ключ дня и его подпись — свойство списка, а не отдельного сообщения:
 * разделители существуют только там, где сообщения выстроены в ленту.
 */

/** Ключ дня: по нему сообщения собираются под один разделитель. */
export const messageDayKey = (createdAt: number): string =>
  dayjs(createdAt).format("YYYY-MM-DD");

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
  const day = dayjs(dayKey).startOf("day");
  const today = dayjs(now).startOf("day");
  const diff = day.diff(today, "day");

  if (diff === 0) return "Сегодня";
  if (diff === -1) return "Вчера";

  return day.format("DD.MM.YYYY");
};
