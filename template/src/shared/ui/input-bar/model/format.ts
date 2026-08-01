/** Формат таймера записи "m:ss,cc" (порт showRecordingUI). */
export const formatRecordTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds) % 60;
  const cs = Math.floor((seconds - Math.floor(seconds)) * 100);

  return `${m}:${s < 10 ? `0${s}` : s},${cs < 10 ? `0${cs}` : cs}`;
};
