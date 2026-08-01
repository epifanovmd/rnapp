/** Формат длительности "m:ss" (порт formatTime из VoiceContentView/MediaCellView). */
export const formatChatDuration = (seconds: number): string => {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  return `${mins}:${secs < 10 ? `0${secs}` : secs}`;
};

/** Формат размера файла (порт ByteCountFormatter .file). */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1000) return `${bytes} байт`;

  const units = ["КБ", "МБ", "ГБ", "ТБ"];
  let value = bytes;
  let unit = -1;

  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }

  const rounded =
    value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;

  return `${rounded} ${units[unit]}`;
};

/** Порт threadReplySuffix: русская плюрализация «N ответов». */
export const threadReplyCountLabel = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 19) return `${count} ответов`;
  if (mod10 === 1) return `${count} ответ`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} ответа`;

  return `${count} ответов`;
};
