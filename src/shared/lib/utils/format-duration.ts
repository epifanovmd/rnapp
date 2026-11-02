/**
 * Длительность из секунд: «2 д 5 ч», «2 ч 5 мин», «3 мин 20 с», «45 с»;
 * пусто — прочерк.
 */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null) return "—";

  const total = Math.round(seconds);
  const d = Math.floor(total / 86_400);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (d) return `${d} д ${h % 24} ч`;
  if (h) return `${h} ч ${m} мин`;
  if (m) return `${m} мин ${s} с`;

  return `${s} с`;
};
