const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const TB = GB * 1024;

/** Объём в байтах по-русски: «512 Б», «12.3 МБ», «1.40 ТБ». */
export const formatBytes = (bytes: number): string => {
  if (bytes >= TB) return `${(bytes / TB).toFixed(2)} ТБ`;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} ГБ`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} МБ`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(1)} КБ`;

  return `${Math.max(0, Math.round(bytes))} Б`;
};
