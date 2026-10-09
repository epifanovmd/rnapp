import { formatter } from "@shared/lib/utils";
import { format } from "date-fns";

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const TB = GB * 1024;

/** Объём в байтах: «512 Б», «12.3 МБ», «1.40 ТБ»; пусто — прочерк. */
export const formatSize = (bytes: number | null | undefined): string => {
  if (bytes == null) return "—";
  if (bytes >= TB) return `${(bytes / TB).toFixed(2)} ТБ`;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} ГБ`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} МБ`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(1)} КБ`;

  return `${Math.max(0, Math.round(bytes))} Б`;
};

/** Скорость в байтах в секунду: «1.2 МБ/с». */
export const formatRate = (bps: number | null | undefined): string =>
  bps == null ? "—" : `${formatSize(bps)}/с`;

/** Проценты без дробной части: «42%». */
export const formatPercent = (value: number | null | undefined): string =>
  value == null ? "—" : `${Math.round(value)}%`;

/** Целое число; пусто — прочерк. */
export const formatCount = (value: number | null | undefined): string =>
  value == null ? "—" : String(Math.round(value));

/** «Занято из всего»: «1.2 ГБ из 8.00 ГБ». */
export const formatUsage = (
  used: number | null | undefined,
  total: number | null | undefined,
): string =>
  used == null
    ? "—"
    : total
      ? `${formatSize(used)} из ${formatSize(total)}`
      : formatSize(used);

/** Доля занятого, %; без итога — `null`. */
export const usagePercent = (
  used: number | null | undefined,
  total: number | null | undefined,
): number | null => (used == null || !total ? null : (used / total) * 100);

/** Длительность в секундах: «3 д 4 ч», «5 ч 12 мин», «40 мин». */
export const formatUptime = (
  seconds: number | undefined,
): string | undefined => {
  if (seconds === undefined) return undefined;

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days} д ${hours} ч`;
  if (hours > 0) return `${hours} ч ${minutes} мин`;

  return `${minutes} мин`;
};

const toIso = (ms: number): string => new Date(ms).toISOString();

/** Дата и время по миллисекундам: «8 октября 2026, 14:05». */
export const formatMoment = (ms: number | null | undefined): string =>
  ms ? formatter.date.format(toIso(ms)) : "—";

/** Сколько прошло: «3 минуты назад», «вчера». */
export const formatAgo = (ms: number | null | undefined): string =>
  ms ? formatter.date.formatDiff(toIso(ms)) : "—";

/** Время строки журнала и события: «21:45:15». */
export const formatClock = (ms: number): string => format(ms, "HH:mm:ss");
